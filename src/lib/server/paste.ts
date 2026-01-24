import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { and, eq, isNull, lte } from 'drizzle-orm';

import { db } from './db';
import { paste } from './db/schema';

const PASSWORD_KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export type PasteRecord = typeof paste.$inferSelect;

type CreatePasteInput = {
	id: string;
	title: string | null;
	content: string;
	contentIv: string | null;
	language: string;
	expiresAt: Date;
	onetime: boolean;
	password: string | null;
};

const derivePasswordHash = (password: string, salt: string) =>
	scryptSync(password, salt, PASSWORD_KEY_LENGTH, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P
	});

const hashPassword = (password: string) => {
	const salt = randomBytes(16).toString('hex');
	const hash = derivePasswordHash(password, salt).toString('hex');

	return { salt, hash };
};

export const verifyPastePassword = (record: PasteRecord, password: string) => {
	if (!record.passwordHash || !record.passwordSalt) return false;

	const hashed = derivePasswordHash(password, record.passwordSalt);
	const storedHash = Buffer.from(record.passwordHash, 'hex');

	if (storedHash.length !== hashed.length) return false;

	return timingSafeEqual(storedHash, hashed);
};

export const createPaste = async ({
	id,
	title,
	content,
	contentIv,
	language,
	expiresAt,
	onetime,
	password
}: CreatePasteInput) => {
	let passwordHash: string | null = null;
	let passwordSalt: string | null = null;

	if (password) {
		const hashed = hashPassword(password);
		passwordHash = hashed.hash;
		passwordSalt = hashed.salt;
	}

	await db.insert(paste).values({
		id,
		title,
		content,
		contentIv,
		language,
		expiresAt,
		onetime,
		passwordHash,
		passwordSalt
	});
};

export const getPasteById = async (id: string) =>
	db.query.paste.findFirst({
		where: and(eq(paste.id, id), isNull(paste.consumedAt))
	});

export const deletePasteById = async (id: string) => db.delete(paste).where(eq(paste.id, id));

export const consumePasteById = async (id: string) => {
	const record = await getPasteById(id);

	if (!record || !record.onetime) return null;

	const updated = await db
		.update(paste)
		.set({
			consumedAt: new Date(),
			content: '',
			contentIv: null,
			passwordHash: null,
			passwordSalt: null
		})
		.where(and(eq(paste.id, id), eq(paste.onetime, true), isNull(paste.consumedAt)))
		.returning({ id: paste.id })
		.get();

	return updated ? record : null;
};

export const consumePasteWithPassword = async (
	id: string,
	password: string | null
): Promise<{ error: string | null; record: PasteRecord | null }> => {
	const record = await getPasteById(id);

	if (!record) return { error: null, record: null };

	if (!record.onetime) {
		return { error: 'Paste ist nicht einmalig.', record: null };
	}

	const requiresPassword = Boolean(record.passwordHash || record.passwordSalt);
	let passwordHash: string | null = null;
	let passwordSalt: string | null = null;

	if (requiresPassword) {
		if (!record.passwordHash || !record.passwordSalt) {
			return { error: 'Zugriff verweigert.', record: null };
		}

		if (!password || typeof password !== 'string' || !password.trim()) {
			return { error: 'Passwort ist erforderlich.', record: null };
		}

		const hashed = derivePasswordHash(password, record.passwordSalt);
		const storedHash = Buffer.from(record.passwordHash, 'hex');

		if (storedHash.length !== hashed.length) {
			return { error: 'Falsches Passwort.', record: null };
		}

		if (!timingSafeEqual(storedHash, hashed)) {
			return { error: 'Falsches Passwort.', record: null };
		}

		passwordHash = hashed.toString('hex');
		passwordSalt = record.passwordSalt;
	}

	const whereClause =
		passwordHash && passwordSalt
			? and(
					eq(paste.id, id),
					isNull(paste.consumedAt),
					eq(paste.passwordHash, passwordHash),
					eq(paste.passwordSalt, passwordSalt)
				)
			: and(eq(paste.id, id), isNull(paste.consumedAt));

	const updated = await db
		.update(paste)
		.set({
			consumedAt: new Date(),
			content: '',
			contentIv: null,
			passwordHash: null,
			passwordSalt: null
		})
		.where(whereClause)
		.returning({ id: paste.id })
		.get();

	return { error: null, record: updated ? record : null };
};

export const deleteExpiredPastes = async () => {
	await db.delete(paste).where(lte(paste.expiresAt, new Date()));
};

export const isPasteExpired = (record: PasteRecord) =>
	record.expiresAt.getTime() <= Date.now() || Boolean(record.consumedAt);

export const getPasteOrDeleteIfExpired = async (id: string) => {
	const record = await getPasteById(id);

	if (!record) return null;
	if (!isPasteExpired(record)) return record;

	await deletePasteById(id);

	return null;
};
