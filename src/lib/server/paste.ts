import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { eq, lte } from 'drizzle-orm';

import { db } from './db';
import { paste } from './db/schema';

const PASSWORD_KEY_LENGTH = 64;

export type PasteRecord = typeof paste.$inferSelect;

type CreatePasteInput = {
	id: string;
	title: string | null;
	content: string;
	language: string;
	expiresAt: Date;
	onetime: boolean;
	password: string | null;
};

const hashPassword = (password: string) => {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');

	return { salt, hash };
};

export const verifyPastePassword = (record: PasteRecord, password: string) => {
	if (!record.passwordHash || !record.passwordSalt) return false;

	const hashed = scryptSync(password, record.passwordSalt, PASSWORD_KEY_LENGTH);
	const storedHash = Buffer.from(record.passwordHash, 'hex');

	if (storedHash.length !== hashed.length) return false;

	return timingSafeEqual(storedHash, hashed);
};

export const createPaste = async ({
	id,
	title,
	content,
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
		language,
		expiresAt,
		onetime,
		passwordHash,
		passwordSalt
	});
};

export const getPasteById = async (id: string) =>
	db.query.paste.findFirst({ where: eq(paste.id, id) });

export const deletePasteById = async (id: string) => db.delete(paste).where(eq(paste.id, id));

export const consumePasteById = async (id: string) => {
	const record = await getPasteById(id);

	if (!record) return null;

	await deletePasteById(id);

	return record;
};

export const deleteExpiredPastes = async () =>
	db.delete(paste).where(lte(paste.expiresAt, new Date()));

export const isPasteExpired = (record: PasteRecord) => record.expiresAt.getTime() <= Date.now();

export const getPasteOrDeleteIfExpired = async (id: string) => {
	const record = await getPasteById(id);

	if (!record) return null;
	if (!isPasteExpired(record)) return record;

	await deletePasteById(id);

	return null;
};
