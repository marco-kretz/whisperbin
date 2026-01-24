type EncryptedPayload = {
	cipherText: string;
	iv: string;
	key: string;
};

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

export const encryptPayload = async (payload: { title: string | null; content: string }) => {
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
		'encrypt',
		'decrypt'
	]);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encodedPayload = encoder.encode(JSON.stringify(payload));
	const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedPayload);
	const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));

	return {
		cipherText: encodeBase64Url(new Uint8Array(cipherBuffer)),
		iv: encodeBase64Url(iv),
		key: encodeBase64Url(rawKey)
	} satisfies EncryptedPayload;
};

export const decryptPayload = async (payload: EncryptedPayload) => {
	const keyBytes = decodeBase64Url(payload.key);
	const ivBytes = decodeBase64Url(payload.iv);
	const cipherBytes = decodeBase64Url(payload.cipherText);

	const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
	const plainBuffer = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: ivBytes },
		key,
		cipherBytes
	);
	const decoded = decoder.decode(plainBuffer);

	return JSON.parse(decoded) as { title: string | null; content: string };
};
