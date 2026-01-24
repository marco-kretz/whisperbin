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

export const getClientIdentifier = (request: Request): string => {
	const forwarded = request.headers.get('x-forwarded-for');
	const ip = forwarded
		? forwarded.split(',')[0]?.trim() || 'unknown'
		: request.headers.get('x-real-ip') || 'unknown';
	return ip;
};

export const addDelay = async () => {
	const delay = Math.floor(Math.random() * 500) + 500;
	await new Promise((resolve) => setTimeout(resolve, delay));
};
