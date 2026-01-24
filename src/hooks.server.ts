import { sequence } from '@sveltejs/kit/hooks';
import type { HandleServerError, Handle } from '@sveltejs/kit';

import { checkRateLimit, getClientIdentifier } from '$lib/server/rate-limit';

const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 30;

export const handleError: HandleServerError = ({ error }) => {
	console.error('Server error:', error);
	return {
		message: 'An error occurred'
	};
};

export const handle: Handle = sequence(async ({ event, resolve }) => {
	const clientIdentifier = getClientIdentifier(event.request);

	if (!checkRateLimit(clientIdentifier, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)) {
		return new Response('Too many requests. Please try again later.', {
			status: 429,
			headers: {
				'Retry-After': '60'
			}
		});
	}

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'no-referrer');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set(
		'Permissions-Policy',
		'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
	);
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

	return response;
});
