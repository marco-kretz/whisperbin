import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/env';

import { getRedisClient } from './redis';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const PASSWORD_WINDOW_MS = 300000;
const PASSWORD_MAX_ATTEMPTS_PER_IP = 10;
const PASSWORD_FREE_FAILURES_PER_PASTE = 5;
const PASSWORD_BASE_DELAY_MS = 250;
const PASSWORD_MAX_DELAY_MS = 5000;

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
}, CLEANUP_INTERVAL).unref();

const sanitizeIdentifier = (identifier: string) => {
	const trimmed = identifier.trim();
	const cleaned = trimmed.replace(/[^0-9a-zA-Z:._-]/g, '').slice(0, 200);
	return cleaned || 'unknown';
};

const checkLocalRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
	const now = Date.now();
	const entry = rateLimitMap.get(key);

	if (!entry || now > entry.resetTime) {
		rateLimitMap.set(key, {
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

const getLimitKeyCount = async (key: string): Promise<number> => {
	const redis = await getRedisClient();

	if (redis) {
		try {
			const raw = await redis.get(key);
			return raw ? parseInt(raw, 10) : 0;
		} catch (error) {
			console.error('Redis rate limit read error:', error);
		}
	}

	const entry = rateLimitMap.get(key);
	return entry && Date.now() <= entry.resetTime ? entry.count : 0;
};

const passwordDelayMs = (failures: number): number =>
	failures < PASSWORD_FREE_FAILURES_PER_PASTE
		? 0
		: Math.min(
				PASSWORD_MAX_DELAY_MS,
				PASSWORD_BASE_DELAY_MS * 2 ** (failures - PASSWORD_FREE_FAILURES_PER_PASTE)
			);

const checkLimitKey = async (
	key: string,
	maxRequests: number,
	windowMs: number
): Promise<boolean> => {
	const redisResult = await checkRedisRateLimit(key, maxRequests, windowMs);

	if (typeof redisResult === 'boolean') return redisResult;

	return checkLocalRateLimit(key, maxRequests, windowMs);
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
	scope: string,
	identifier: string,
	maxRequests: number,
	windowMs: number
): Promise<boolean> => {
	// No rate limiting under `vite dev`; production builds are unaffected
	if (dev) return true;
	const safeScope = sanitizeIdentifier(scope);
	const safeIdentifier = sanitizeIdentifier(identifier);
	return checkLimitKey(`rate:${safeScope}:${safeIdentifier}`, maxRequests, windowMs);
};

export const checkPasswordRateLimit = async (
	identifier: string,
	pasteId: string
): Promise<boolean> => {
	if (dev) return true;
	const safeIdentifier = sanitizeIdentifier(identifier);
	const ipAllowed = await checkLimitKey(
		`password:ip:${safeIdentifier}`,
		PASSWORD_MAX_ATTEMPTS_PER_IP,
		PASSWORD_WINDOW_MS
	);
	if (!ipAllowed) return false;

	// Per-paste failures slow every attempt down instead of blocking, so attackers can't lock
	// out the real recipient. The delay runs before verification so hanging up early saves nothing.
	// shortcut: parallel requests sleep concurrently, so distributed guessing is bounded only by the
	// per-IP limit; add a per-paste attempt queue if that ever matters.
	const safePasteId = sanitizeIdentifier(pasteId);
	const failures = await getLimitKeyCount(`password:paste:${safePasteId}`);
	const delay = passwordDelayMs(failures);
	if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
	return true;
};

export const recordPasswordFailure = async (pasteId: string): Promise<void> => {
	if (dev) return;
	const safePasteId = sanitizeIdentifier(pasteId);
	// Infinity: this key only counts failures, it never blocks
	await checkLimitKey(`password:paste:${safePasteId}`, Infinity, PASSWORD_WINDOW_MS);
};

export const addDelay = async () => {
	const delay = Math.floor(Math.random() * 500) + 500;
	await new Promise((resolve) => setTimeout(resolve, delay));
};
