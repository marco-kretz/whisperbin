import type { RequestEvent } from '@sveltejs/kit';

import { getRedisClient } from './redis';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const passwordAttemptMap = new Map<string, { count: number; resetTime: number }>();

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

// Proxy headers are resolved by adapter-node (ADDRESS_HEADER / XFF_DEPTH).
// It throws if ADDRESS_HEADER is set but missing, e.g. requests bypassing Cloudflare.
export const getClientIdentifier = (event: RequestEvent): string => {
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
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
