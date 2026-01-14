import { error, fail } from '@sveltejs/kit';

import { getPasteOrDeleteIfExpired, verifyPastePassword } from '$lib/server/paste';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const record = await getPasteOrDeleteIfExpired(params.id);

	if (!record) {
		throw error(404, 'Paste not found');
	}

	const requiresPassword = Boolean(record.passwordHash && record.passwordSalt);

	return {
		paste: {
			id: record.id,
			title: record.title,
			content: requiresPassword ? null : record.content,
			language: record.language,
			createdAt: record.createdAt,
			expiresAt: record.expiresAt,
			requiresPassword
		}
	};
};

export const actions: Actions = {
	unlock: async ({ params, request }) => {
		const record = await getPasteOrDeleteIfExpired(params.id);

		if (!record) {
			throw error(404, 'Paste not found');
		}

		const formData = await request.formData();
		const password = formData.get('password');

		if (!record.passwordHash || !record.passwordSalt) {
			return { content: record.content };
		}

		if (typeof password !== 'string' || !password.trim()) {
			return fail(400, { error: 'Password is required.' });
		}

		if (!verifyPastePassword(record, password)) {
			return fail(403, { error: 'Incorrect password.' });
		}

		return { content: record.content };
	}
};
