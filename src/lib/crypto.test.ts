import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decryptPayload, encryptPayload } from './crypto.ts';

const payload = { title: 'Title', content: 'Secret content' };

test('round-trips without a password', async () => {
	const encrypted = await encryptPayload(payload);
	assert.deepEqual(await decryptPayload(encrypted), payload);
});

test('round-trips with a password', async () => {
	const encrypted = await encryptPayload(payload, ' pass wörd ');
	assert.deepEqual(await decryptPayload({ ...encrypted, password: ' pass wörd ' }), payload);
});

test('link key alone cannot decrypt a password paste', async () => {
	const encrypted = await encryptPayload(payload, 'correct');
	await assert.rejects(decryptPayload(encrypted));
});

test('wrong password cannot decrypt a password paste', async () => {
	const encrypted = await encryptPayload(payload, 'correct');
	await assert.rejects(decryptPayload({ ...encrypted, password: 'wrong' }));
});

test('legacy password paste encrypted with the link key alone still decrypts', async () => {
	const encrypted = await encryptPayload(payload);
	assert.deepEqual(await decryptPayload({ ...encrypted, password: 'any' }), payload);
});
