import { error, fail } from '@sveltejs/kit';

import { consumePasteWithPassword, getPasteOrDeleteIfExpired } from '#lib/server/paste.js';
import type { Actions, PageServerLoad } from './$types';

import { addDelay, checkPasswordRateLimit, getClientIdentifier } from '#lib/server/rate-limit.js';

const MAX_PASSWORD_LENGTH = 200;

export const load: PageServerLoad = async ({ params }) => {
	const record = await getPasteOrDeleteIfExpired(params.id);

	if (!record) {
		throw error(404, 'Paste not found');
	}

	const requiresPassword = Boolean(record.passwordHash || record.passwordSalt);
	const shouldHideContent = record.onetime || requiresPassword;
	const encrypted = Boolean(record.contentIv);

	return {
		paste: {
			id: record.id,
			title: encrypted ? null : record.title,
			content: shouldHideContent ? null : record.content,
			contentIv: shouldHideContent ? null : record.contentIv,
			language: record.language,
			createdAt: record.createdAt,
			expiresAt: record.expiresAt,
			onetime: record.onetime,
			requiresPassword,
			encrypted
		}
	};
};

export const actions: Actions = {
	unlock: async (event) => {
		const { params, request } = event;
		const record = await getPasteOrDeleteIfExpired(params.id);

		if (!record) {
			throw error(404, 'Paste not found');
		}

		const requiresPassword = Boolean(record.passwordHash || record.passwordSalt);

		if (!requiresPassword) {
			if (record.onetime) {
				return fail(400, {
					error: 'useOnetime'
				});
			}
			return {
				content: record.content,
				contentIv: record.contentIv
			};
		}

		const clientIdentifier = getClientIdentifier(event);
		if (!(await checkPasswordRateLimit(clientIdentifier))) {
			return fail(429, { error: 'tooManyAttempts' });
		}

		const formData = await request.formData();
		const password = formData.get('password');
		const passwordValue = typeof password === 'string' ? password : null;

		if (passwordValue && passwordValue.length > MAX_PASSWORD_LENGTH) {
			await addDelay();
			return fail(400, { error: 'passwordTooLong', max: MAX_PASSWORD_LENGTH });
		}

		if (!passwordValue || !passwordValue.trim()) {
			await addDelay();
			return fail(400, { error: 'passwordRequired' });
		}

		if (record.onetime) {
			const result = await consumePasteWithPassword(record.id, passwordValue);

			if (result.error) {
				if (result.error !== 'passwordRequired') {
					await addDelay();
				}
				return fail(400, { error: result.error });
			}

			if (!result.record) {
				throw error(404, 'Paste not found');
			}

			return {
				content: result.record.content,
				contentIv: result.record.contentIv
			};
		}

		const verified = await import('#lib/server/paste.js').then((m) =>
			m.verifyPastePassword(record, passwordValue)
		);

		if (!verified) {
			await addDelay();
			return fail(400, { error: 'accessDenied' });
		}

		return {
			content: record.content,
			contentIv: record.contentIv
		};
	},
	consume: async (event) => {
		const { params, request } = event;
		const record = await getPasteOrDeleteIfExpired(params.id);

		if (!record) {
			throw error(404, 'Paste not found');
		}

		if (!record.onetime) {
			return fail(400, { error: 'notOnetime' });
		}

		const clientIdentifier = getClientIdentifier(event);
		if (record.passwordHash || record.passwordSalt) {
			if (!(await checkPasswordRateLimit(clientIdentifier))) {
				return fail(429, { error: 'tooManyAttempts' });
			}
		}

		const formData = await request.formData();
		const password = formData.get('password');
		const passwordValue = typeof password === 'string' ? password : null;

		if (passwordValue && passwordValue.length > MAX_PASSWORD_LENGTH) {
			await addDelay();
			return fail(400, { error: 'passwordTooLong', max: MAX_PASSWORD_LENGTH });
		}

		const result = await consumePasteWithPassword(record.id, passwordValue);

		if (result.error) {
			if (result.error !== 'passwordRequired') {
				await addDelay();
			}
			return fail(400, { error: result.error });
		}

		if (!result.record) {
			throw error(404, 'Paste not found');
		}

		return {
			content: result.record.content,
			contentIv: result.record.contentIv
		};
	}
};
