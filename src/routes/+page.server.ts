import { randomUUID } from 'node:crypto';

import { fail } from '@sveltejs/kit';
import { getExpirationMs, isLanguageValue } from '$lib/paste-options';
import { createPaste, deleteExpiredPastes } from '$lib/server/paste';
import type { Actions, PageServerLoad } from './$types';

const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 20000;
const MAX_PASSWORD_LENGTH = 200;

const normalizeOptionalString = (value: FormDataEntryValue | null) =>
	typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const load: PageServerLoad = async ({ url }) => ({
	origin: url.origin
});

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const title = normalizeOptionalString(formData.get('title'));
		const rawContent = formData.get('content');
		const content = typeof rawContent === 'string' ? rawContent : '';
		const expiresIn = formData.get('expiresIn');
		const expiresInValue = typeof expiresIn === 'string' ? expiresIn : null;
		const language = formData.get('language');
		const languageValue = typeof language === 'string' ? language : null;
		const password = normalizeOptionalString(formData.get('password'));

		if (!content.trim()) {
			return fail(400, {
				error: 'Content is required.',
				values: {
					title,
					content,
					expiresIn: expiresInValue,
					language: languageValue
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
					language: languageValue
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
					language: languageValue
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
					language: languageValue
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
					language: languageValue
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
					language: languageValue
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
					language: languageValue
				}
			});
		}

		const id = randomUUID();
		const expiresAt = new Date(Date.now() + durationMs);

		await deleteExpiredPastes();
		await createPaste({
			id,
			title,
			content,
			language: languageValue,
			expiresAt,
			password
		});

		return { id };
	}
};
