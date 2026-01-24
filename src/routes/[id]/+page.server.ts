import { error, fail } from '@sveltejs/kit';

import { consumePasteWithPassword, getPasteOrDeleteIfExpired } from '$lib/server/paste';
import type { Actions, PageServerLoad } from './$types';

import { addDelay, checkPasswordRateLimit, getClientIdentifier } from '$lib/server/rate-limit';

export const load: PageServerLoad = async ({ params }) => {
	const record = await getPasteOrDeleteIfExpired(params.id);

	if (!record) {
		throw error(404, 'Unable to find paste');
	}

	const requiresPassword = Boolean(record.passwordHash || record.passwordSalt);
	const shouldHideContent = record.onetime || requiresPassword;

	return {
		paste: {
			id: record.id,
			title: record.title,
			content: shouldHideContent ? null : record.content,
			language: record.language,
			createdAt: record.createdAt,
			expiresAt: record.expiresAt,
			onetime: record.onetime,
			requiresPassword
		}
	};
};

export const actions: Actions = {
	unlock: async ({ params, request }) => {
		const record = await getPasteOrDeleteIfExpired(params.id);

		if (!record) {
			throw error(404, 'Unable to find paste');
		}

		const requiresPassword = Boolean(record.passwordHash || record.passwordSalt);

		if (!requiresPassword) {
			if (record.onetime) {
				return fail(400, { error: 'Use the one-time reveal action to access this paste.' });
			}
			return { content: record.content };
		}

		const clientIdentifier = getClientIdentifier(request);
		if (!checkPasswordRateLimit(clientIdentifier)) {
			return fail(429, { error: 'Too many attempts. Please try again later.' });
		}

		const formData = await request.formData();
		const password = formData.get('password');
		const passwordValue = typeof password === 'string' ? password : null;

		if (!passwordValue || !passwordValue.trim()) {
			await addDelay();
			return fail(400, { error: 'Password is required.' });
		}

		if (record.onetime) {
			const result = await consumePasteWithPassword(record.id, passwordValue);

			if (result.error) {
				if (result.error !== 'Password is required.') {
					await addDelay();
				}
				return fail(400, { error: result.error });
			}

			if (!result.record) {
				throw error(404, 'Unable to find paste');
			}

			return { content: result.record.content };
		}

		const verified = await import('$lib/server/paste').then((m) =>
			m.verifyPastePassword(record, passwordValue)
		);

		if (!verified) {
			await addDelay();
			return fail(400, { error: 'Access denied.' });
		}

		return { content: record.content };
	},
	consume: async ({ params, request }) => {
		const record = await getPasteOrDeleteIfExpired(params.id);

		if (!record) {
			throw error(404, 'Unable to find paste');
		}

		if (!record.onetime) {
			return fail(400, { error: 'Paste is not one-time.' });
		}

		const clientIdentifier = getClientIdentifier(request);
		if (record.passwordHash || record.passwordSalt) {
			if (!checkPasswordRateLimit(clientIdentifier)) {
				return fail(429, { error: 'Too many attempts. Please try again later.' });
			}
		}

		const formData = await request.formData();
		const password = formData.get('password');
		const passwordValue = typeof password === 'string' ? password : null;

		const result = await consumePasteWithPassword(record.id, passwordValue);

		if (result.error) {
			if (result.error !== 'Password is required.') {
				await addDelay();
			}
			return fail(400, { error: result.error });
		}

		if (!result.record) {
			throw error(404, 'Unable to find paste');
		}

		return { content: result.record.content };
	}
};
