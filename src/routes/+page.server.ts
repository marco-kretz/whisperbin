import { randomUUID } from 'node:crypto';

import { fail } from '@sveltejs/kit';
import { getExpirationMs, isLanguageValue } from '$lib/paste-options';
import { createPaste, deleteExpiredPastes } from '$lib/server/paste';
import DOMPurify from 'isomorphic-dompurify';
import { checkRateLimit, getClientIdentifier } from '$lib/server/rate-limit';
import type { Actions, PageServerLoad } from './$types';

const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 20000;
const MAX_PASSWORD_LENGTH = 200;

const normalizeOptionalString = (value: FormDataEntryValue | null): string | null => {
	if (value === null) return null;
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

export const load: PageServerLoad = async ({ url }) => ({
	origin: url.origin
});

export const actions: Actions = {
	default: async ({ request }) => {
		const clientIdentifier = getClientIdentifier(request);

		if (!checkRateLimit(clientIdentifier, 10, 60000)) {
			return fail(429, { error: 'Too many requests. Please try again later.' });
		}

		const formData = await request.formData();
		const title = normalizeOptionalString(formData.get('title'));
		const rawContent = formData.get('content');
		const content = typeof rawContent === 'string' ? rawContent : '';
		const expiresIn = formData.get('expiresIn');
		const expiresInValue = typeof expiresIn === 'string' ? expiresIn : null;
		const language = formData.get('language');
		const languageValue = typeof language === 'string' ? language : null;
		const password = normalizeOptionalString(formData.get('password'));
		const onetime = formData.get('onetime') === 'on';

		if (!content.trim()) {
			return fail(400, {
				error: 'Content is required.',
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null
				}
			});
		}

		if (content.length > MAX_CONTENT_LENGTH) {
			return fail(400, {
				error: `Content must be under ${MAX_CONTENT_LENGTH} characters.`,
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null
				}
			});
		}

		if (title && title.length > MAX_TITLE_LENGTH) {
			return fail(400, {
				error: `Title must be under ${MAX_TITLE_LENGTH} characters.`,
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null
				}
			});
		}

		if (password && password.length > MAX_PASSWORD_LENGTH) {
			return fail(400, {
				error: `Password must be under ${MAX_PASSWORD_LENGTH} characters.`,
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null
				}
			});
		}

		if (!expiresInValue) {
			return fail(400, {
				error: 'Expiration is required.',
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null
				}
			});
		}

		if (!languageValue || !isLanguageValue(languageValue)) {
			return fail(400, {
				error: 'File type is invalid.',
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null
				}
			});
		}

		const durationMs = getExpirationMs(expiresInValue);

		if (!durationMs) {
			return fail(400, {
				error: 'Expiration is invalid.',
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null
				}
			});
		}

		const id = randomUUID();
		const expiresAt = new Date(Date.now() + durationMs);

		const sanitizedTitle = title ? DOMPurify.sanitize(title) : null;
		const sanitizedContent = DOMPurify.sanitize(content);

		await deleteExpiredPastes();
		await createPaste({
			id,
			title: sanitizedTitle,
			content: sanitizedContent,
			language: languageValue,
			expiresAt,
			onetime,
			password
		});

		return { id };
	}
};
