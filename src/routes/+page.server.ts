import { randomUUID } from 'node:crypto';

import { fail } from '@sveltejs/kit';
import { getExpirationMs, isLanguageValue } from '#lib/paste-options.js';
import { createPaste, deleteExpiredPastes } from '#lib/server/paste.js';
import { checkRateLimit, getClientIdentifier } from '#lib/server/rate-limit.js';
import type { Actions, PageServerLoad } from './$types';

const MAX_CIPHERTEXT_LENGTH = 120000;
const MAX_PASSWORD_LENGTH = 200;
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_SIZE = 256 * 1024; // 256KB
const IV_LENGTH = 16;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

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
	default: async (event) => {
		const clientIdentifier = getClientIdentifier(event);
		const { request } = event;

		const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
		if (contentLength > MAX_BODY_SIZE) {
			return fail(413, { error: 'requestTooLarge' });
		}

		if (!(await checkRateLimit(clientIdentifier, 10, 60000))) {
			return fail(429, { error: 'tooManyRequests' });
		}

		const formData = await request.formData();
		const rawContent = formData.get('content');
		const content = typeof rawContent === 'string' ? rawContent : '';
		const contentIv = normalizeOptionalString(formData.get('contentIv'));
		const encrypted = formData.get('encrypted') === '1';
		const expiresIn = formData.get('expiresIn');
		const expiresInValue = typeof expiresIn === 'string' ? expiresIn : null;
		const language = formData.get('language');
		const languageValue = typeof language === 'string' ? language : null;
		const password = normalizeOptionalString(formData.get('password'));
		const onetime = formData.get('onetime') === 'on';
		const rawTitle = formData.get('title');
		const title = typeof rawTitle === 'string' ? rawTitle : '';

		if (title.length > MAX_TITLE_LENGTH) {
			return fail(400, {
				error: 'titleTooLong',
				max: MAX_TITLE_LENGTH,
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		const hasValidIv =
			typeof contentIv === 'string' &&
			contentIv.length === IV_LENGTH &&
			BASE64URL_PATTERN.test(contentIv);

		if (!encrypted || !contentIv || !hasValidIv) {
			return fail(400, {
				error: 'e2eRequired',
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		if (!content.trim()) {
			return fail(400, {
				error: 'contentRequired',
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		if (content.length > MAX_CIPHERTEXT_LENGTH) {
			return fail(400, {
				error: 'cipherTooLarge',
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		if (password && password.length > MAX_PASSWORD_LENGTH) {
			return fail(400, {
				error: 'passwordTooLong',
				max: MAX_PASSWORD_LENGTH,
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		if (!expiresInValue) {
			return fail(400, {
				error: 'expiryRequired',
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		if (!languageValue || !isLanguageValue(languageValue)) {
			return fail(400, {
				error: 'formatInvalid',
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		const durationMs = getExpirationMs(expiresInValue);

		if (!durationMs) {
			return fail(400, {
				error: 'expiryInvalid',
				values: {
					expiresIn: expiresInValue,
					language: languageValue,
					onetime: onetime ? 'on' : null,
					encrypted: encrypted ? '1' : null
				}
			});
		}

		const id = randomUUID();
		const expiresAt = new Date(Date.now() + durationMs);

		await deleteExpiredPastes();
		await createPaste({
			id,
			title: null,
			content,
			contentIv,
			language: languageValue,
			expiresAt,
			onetime,
			password
		});

		return { id };
	}
};
