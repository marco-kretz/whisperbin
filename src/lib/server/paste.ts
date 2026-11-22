import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

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

const scryptAsync = promisify(scrypt) as (
	password: string,
	salt: string,
	keylen: number,
	options: { N: number; r: number; p: number }
) => Promise<Buffer>;

const derivePasswordHash = (password: string, salt: string) =>
	scryptAsync(password, salt, PASSWORD_KEY_LENGTH, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P
	});

const hashPassword = async (password: string) => {
	const salt = randomBytes(16).toString('hex');
	const hash = (await derivePasswordHash(password, salt)).toString('hex');

	return { salt, hash };
};

export const verifyPastePassword = async (record: PasteRecord, password: string) => {
	if (!record.passwordHash || !record.passwordSalt) return false;

	const hashed = await derivePasswordHash(password, record.passwordSalt);
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
		const hashed = await hashPassword(password);
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

export const consumePasteWithPassword = async (
	id: string,
	password: string | null
): Promise<{
	error: 'notOnetime' | 'accessDenied' | 'passwordRequired' | 'wrongPassword' | null;
	record: PasteRecord | null;
}> => {
	const record = await getPasteById(id);

	if (!record) return { error: null, record: null };

	if (!record.onetime) {
		return { error: 'notOnetime', record: null };
	}

	const requiresPassword = Boolean(record.passwordHash || record.passwordSalt);
	let passwordHash: string | null = null;
	let passwordSalt: string | null = null;

	if (requiresPassword) {
		if (!record.passwordHash || !record.passwordSalt) {
			return { error: 'accessDenied', record: null };
		}

		if (!password || typeof password !== 'string') {
			return { error: 'passwordRequired', record: null };
		}

		const hashed = await derivePasswordHash(password, record.passwordSalt);
		const storedHash = Buffer.from(record.passwordHash, 'hex');

		if (storedHash.length !== hashed.length) {
			return { error: 'wrongPassword', record: null };
		}

		if (!timingSafeEqual(storedHash, hashed)) {
			return { error: 'wrongPassword', record: null };
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
			title: null,
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
