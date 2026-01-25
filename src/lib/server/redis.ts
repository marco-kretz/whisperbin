import { createClient } from 'redis';
import { env } from '$env/dynamic/private';

const redisUrl = env.RATE_LIMIT_REDIS_URL ?? env.REDIS_URL ?? null;
const isProduction = process.env.NODE_ENV === 'production';

let client: ReturnType<typeof createClient> | null = null;
let connectionPromise: Promise<ReturnType<typeof createClient> | null> | null = null;
let warnedMissing = false;

const connectRedis = async () => {
	if (!redisUrl) return null;

	const instance = createClient({ url: redisUrl });
	instance.on('error', (error) => {
		console.error('Redis client error:', error);
	});

	await instance.connect();

	return instance;
};

export const getRedisClient = async () => {
	if (!redisUrl) {
		if (isProduction) {
			throw new Error('RATE_LIMIT_REDIS_URL is not set');
		}

		if (!warnedMissing) {
			console.warn('RATE_LIMIT_REDIS_URL is not set. Falling back to in-memory rate limits.');
			warnedMissing = true;
		}

		return null;
	}

	if (client?.isOpen) return client;

	// Connection dropped or never established - reset state for fresh connection
	if (client && !client.isOpen) {
		client = null;
		connectionPromise = null;
	}

	if (!connectionPromise) {
		connectionPromise = connectRedis()
			.then((instance) => {
				client = instance;
				return client;
			})
			.catch((error) => {
				console.error('Redis connection error:', error);
				client = null;
				connectionPromise = null;
				return null;
			});
	}

	return connectionPromise;
};
