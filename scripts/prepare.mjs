import { accessSync, constants } from 'node:fs';
import { spawnSync } from 'node:child_process';

const svelteKitBin = process.platform === 'win32' ? 'svelte-kit.cmd' : 'svelte-kit';
const svelteKitPath = `node_modules/.bin/${svelteKitBin}`;

try {
	accessSync(svelteKitPath, constants.X_OK);
} catch {
	process.exit(0);
}

const result = spawnSync(svelteKitPath, ['sync'], {
	stdio: 'inherit',
	shell: process.platform === 'win32'
});

process.exit(result.status ?? 0);
