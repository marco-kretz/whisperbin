import { randomUUID } from 'node:crypto';

import { fail } from '@sveltejs/kit';
import { getExpirationMs, isLanguageValue } from '$lib/paste-options';
import { createPaste, deleteExpiredPastes } from '$lib/server/paste';
import { checkRateLimit, getClientIdentifier } from '$lib/server/rate-limit';
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
			return fail(413, { error: 'Anfrage ist zu groß.' });
		}

		if (!(await checkRateLimit(clientIdentifier, 10, 60000))) {
			return fail(429, { error: 'Zu viele Anfragen. Bitte versuche es später erneut.' });
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
				error: `Titel muss unter ${MAX_TITLE_LENGTH} Zeichen sein.`,
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
				error: 'Ende-zu-Ende-Verschlüsselung ist erforderlich.',
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
				error: 'Inhalt ist erforderlich.',
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
				error: 'Verschlüsselte Daten sind zu groß.',
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
				error: `Passwort muss unter ${MAX_PASSWORD_LENGTH} Zeichen sein.`,
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
				error: 'Ablaufzeit ist erforderlich.',
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
				error: 'Dateityp ist ungültig.',
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
				error: 'Ablaufzeit ist ungültig.',
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
