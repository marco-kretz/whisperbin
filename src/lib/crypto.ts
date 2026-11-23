type EncryptedPayload = {
	cipherText: string;
	iv: string;
	key: string;
};

// OWASP recommendation for PBKDF2-HMAC-SHA256
const PBKDF2_ITERATIONS = 600_000;
const RAW_KEY_LENGTH = 32;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array) => {
	let binary = '';
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
};

const base64ToBytes = (base64: string) => {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

export const encodeBase64Url = (bytes: Uint8Array) =>
	bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

export const decodeBase64Url = (value: string) => {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
	return base64ToBytes(padded);
};

// The random link key doubles as the PBKDF2 salt: it is unique per paste and secret, so with a
// password set neither the link nor the password alone can derive the AES key.
const deriveAesKey = async (
	rawKey: Uint8Array<ArrayBuffer>,
	password: string | null,
	usage: 'encrypt' | 'decrypt'
) => {
	if (!password) return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, [usage]);

	const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
		'deriveKey'
	]);
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: rawKey, iterations: PBKDF2_ITERATIONS },
		material,
		{ name: 'AES-GCM', length: 256 },
		false,
		[usage]
	);
};

export const encryptPayload = async (
	payload: { title: string | null; content: string },
	password: string | null = null
) => {
	const rawKey = crypto.getRandomValues(new Uint8Array(RAW_KEY_LENGTH));
	const key = await deriveAesKey(rawKey, password, 'encrypt');
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encodedPayload = encoder.encode(JSON.stringify(payload));
	const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedPayload);

	return {
		cipherText: encodeBase64Url(new Uint8Array(cipherBuffer)),
		iv: encodeBase64Url(iv),
		key: encodeBase64Url(rawKey)
	} satisfies EncryptedPayload;
};

export const decryptPayload = async (payload: EncryptedPayload & { password?: string | null }) => {
	const keyBytes = decodeBase64Url(payload.key);
	const ivBytes = decodeBase64Url(payload.iv);
	const cipherBytes = decodeBase64Url(payload.cipherText);
	const password = payload.password || null;

	const decryptWith = async (key: CryptoKey) =>
		decoder.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, cipherBytes));

	let decoded: string;
	try {
		decoded = await decryptWith(await deriveAesKey(keyBytes, password, 'decrypt'));
	} catch (error) {
		// shortcut: password pastes created before password-based key derivation used the link key
		// alone; remove this fallback 7 days (the longest expiry) after that change is deployed.
		if (!password) throw error;
		decoded = await decryptWith(await deriveAesKey(keyBytes, null, 'decrypt'));
	}

	return JSON.parse(decoded) as { title: string | null; content: string };
};

const PASSWORD_CLASSES = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789'];
const PASSWORD_SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/~';

const randomIndex = (max: number) => {
	// Rejection sampling avoids modulo bias.
	const limit = Math.floor(0x100000000 / max) * max;
	const buffer = new Uint32Array(1);
	do crypto.getRandomValues(buffer);
	while (buffer[0] >= limit);
	return buffer[0] % max;
};

export const generatePassword = (length: number, withSymbols: boolean) => {
	const classes = withSymbols ? [...PASSWORD_CLASSES, PASSWORD_SYMBOLS] : PASSWORD_CLASSES;
	const charset = classes.join('');
	let password: string;
	// Retry until every class is present, so the result passes typical password policies.
	do password = Array.from({ length }, () => charset[randomIndex(charset.length)]).join('');
	while (!classes.every((set) => [...password].some((char) => set.includes(char))));
	return password;
};
