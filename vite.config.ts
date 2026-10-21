import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// Consult https://svelte.dev/docs/kit/integrations
			// for more information about preprocessors
			preprocess: vitePreprocess(),
			adapter: adapter(),
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'base-uri': ['none'],
					'form-action': ['self'],
					'frame-ancestors': ['none'],
					'object-src': ['none'],
					'img-src': ['self', 'data:'],
					'font-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'script-src': ['self'],
					'connect-src': isDev ? ['self', 'ws:'] : ['self'],
					'upgrade-insecure-requests': true
				}
			}
		})
	]
});
