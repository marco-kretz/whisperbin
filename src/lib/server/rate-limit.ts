import type { RequestEvent } from '@sveltejs/kit';

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

export const checkRateLimit = (
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

export const checkPasswordRateLimit = (identifier: string): boolean => {
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

const isPrivateIpv4 = (address: string) => {
	const parts = address.split('.').map((part) => Number(part));
	if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

	const [first, second] = parts;

	if (first === 10) return true;
	if (first === 127) return true;
	if (first === 169 && second === 254) return true;
	if (first === 172 && second >= 16 && second <= 31) return true;
	if (first === 192 && second === 168) return true;
	if (first === 100 && second >= 64 && second <= 127) return true;

	return false;
};

const isPrivateIpv6 = (address: string) => {
	const normalized = address.toLowerCase();
	if (normalized === '::1') return true;
	if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
	if (normalized.startsWith('fe80')) return true;
	return false;
};

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

const isPrivateAddress = (address: string) => {
	const normalized = normalizeAddress(address);

	if (normalized.includes('.')) {
		return isPrivateIpv4(normalized);
	}

	if (normalized.includes(':')) {
		if (normalized.startsWith('::ffff:')) {
			return isPrivateIpv4(normalized.replace('::ffff:', ''));
		}
		return isPrivateIpv6(normalized);
	}

	return false;
};

const getForwardedClient = (request: Request) => {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const candidate = forwarded.split(',')[0]?.trim();
		if (candidate) return candidate;
	}
	const realIp = request.headers.get('x-real-ip');
	return realIp?.trim() || null;
};

export const getClientIdentifier = (event: RequestEvent): string => {
	let directAddress: string | null = null;

	try {
		directAddress = normalizeAddress(event.getClientAddress());
	} catch {
		directAddress = null;
	}

	const forwarded = getForwardedClient(event.request);

	if (directAddress && isPrivateAddress(directAddress) && forwarded) {
		return forwarded;
	}

	if (directAddress) return directAddress;
	if (forwarded) return forwarded;

	return 'unknown';
};

export const addDelay = async () => {
	const delay = Math.floor(Math.random() * 500) + 500;
	await new Promise((resolve) => setTimeout(resolve, delay));
};
