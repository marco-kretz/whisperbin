import { isIP } from 'node:net';

import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { getRedisClient } from './redis';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const passwordAttemptMap = new Map<string, { count: number; resetTime: number }>();

const DEFAULT_TRUSTED_PROXIES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const trustedProxyIps = new Set(
	(env.TRUSTED_PROXY_IPS ?? '')
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
);

const cleanupMap = (map: Map<string, { count: number; resetTime: number }>) => {
	const now = Date.now();
	for (const [key, entry] of map) {
		if (now > entry.resetTime) {
			map.delete(key);
		}
	}
};

const CLEANUP_INTERVAL = 60000;
setInterval(() => {
	cleanupMap(rateLimitMap);
	cleanupMap(passwordAttemptMap);
}, CLEANUP_INTERVAL).unref();

const normalizeAddress = (value: string) => {
	if (!value) return value;
	if (value.startsWith('[')) {
		const end = value.indexOf(']');
		return end === -1 ? value : value.slice(1, end);
	}
	if (value.includes('.') && value.includes(':')) {
		return value.split(':')[0] ?? value;
	}
	return value;
};

const MAX_IP_LENGTH = 45; // Max IPv6 length

const normalizeIp = (value: string | null) => {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > MAX_IP_LENGTH) return null;
	const normalized = normalizeAddress(trimmed);
	if (!normalized || normalized.length > MAX_IP_LENGTH) return null;
	if (isIP(normalized) === 0) return null;
	return normalized;
};

const getForwardedClient = (request: Request) => {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const candidate = forwarded.split(',')[0]?.trim();
		const normalized = normalizeIp(candidate ?? null);
		if (normalized) return normalized;
	}
	const realIp = request.headers.get('x-real-ip');
	return normalizeIp(realIp?.trim() ?? null);
};

const isTrustedProxy = (address: string | null) => {
	if (!address) return false;
	if (trustedProxyIps.size > 0) {
		return trustedProxyIps.has(address);
	}
	return DEFAULT_TRUSTED_PROXIES.has(address);
};

const sanitizeIdentifier = (identifier: string) => {
	const trimmed = identifier.trim();
	const cleaned = trimmed.replace(/[^0-9a-zA-Z:._-]/g, '').slice(0, 200);
	return cleaned || 'unknown';
};

const checkLocalRateLimit = (
	identifier: string,
	maxRequests: number,
	windowMs: number
): boolean => {
	const now = Date.now();
	const entry = rateLimitMap.get(identifier);

	if (!entry || now > entry.resetTime) {
		rateLimitMap.set(identifier, {
			count: 1,
			resetTime: now + windowMs
		});
		return true;
	}

	if (entry.count >= maxRequests) {
		return false;
	}

	entry.count++;
	return true;
};

const checkLocalPasswordRateLimit = (identifier: string): boolean => {
	const now = Date.now();
	const entry = passwordAttemptMap.get(identifier);

	if (!entry || now > entry.resetTime) {
		passwordAttemptMap.set(identifier, {
			count: 1,
			resetTime: now + 300000
		});
		return true;
	}

	if (entry.count >= 10) {
		return false;
	}

	entry.count++;
	return true;
};

const checkRedisRateLimit = async (
	key: string,
	maxRequests: number,
	windowMs: number
): Promise<boolean | null> => {
	const redis = await getRedisClient();
	if (!redis) return null;

	try {
		const count = await redis.incr(key);
		if (count === 1) {
			await redis.pExpire(key, windowMs);
		} else {
			const ttl = await redis.pTTL(key);
			if (typeof ttl === 'number' && ttl < 0) {
				await redis.pExpire(key, windowMs);
			}
		}
		return count <= maxRequests;
	} catch (error) {
		console.error('Redis rate limit error:', error);
		return null;
	}
};

export const getClientIdentifier = (event: RequestEvent): string => {
	let directAddress: string | null = null;

	try {
		directAddress = normalizeIp(event.getClientAddress());
	} catch {
		directAddress = null;
	}

	const forwarded = getForwardedClient(event.request);

	if (directAddress && forwarded && isTrustedProxy(directAddress)) {
		return forwarded;
	}

	if (directAddress) return directAddress;

	return 'unknown';
};

export const checkRateLimit = async (
	identifier: string,
	maxRequests: number,
	windowMs: number
): Promise<boolean> => {
	const safeIdentifier = sanitizeIdentifier(identifier);
	const key = `rate:${safeIdentifier}`;
	const redisResult = await checkRedisRateLimit(key, maxRequests, windowMs);

	if (typeof redisResult === 'boolean') return redisResult;

	return checkLocalRateLimit(safeIdentifier, maxRequests, windowMs);
};

export const checkPasswordRateLimit = async (identifier: string): Promise<boolean> => {
	const safeIdentifier = sanitizeIdentifier(identifier);
	const key = `password:${safeIdentifier}`;
	const redisResult = await checkRedisRateLimit(key, 10, 300000);

	if (typeof redisResult === 'boolean') return redisResult;

	return checkLocalPasswordRateLimit(safeIdentifier);
};

export const addDelay = async () => {
	const delay = Math.floor(Math.random() * 500) + 500;
	await new Promise((resolve) => setTimeout(resolve, delay));
};
