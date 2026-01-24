import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
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
				'style-src': isDev
				? ['self', 'unsafe-inline']
				: ['self', "'sha256-S8qMpvofolR8Mpjy4kQvEm7m1q8clzU4dfDH0AmvZjo='"],
				'script-src': ['self'],
				'connect-src': isDev ? ['self', 'ws:'] : ['self'],
				'upgrade-insecure-requests': true
			}
		}
	}
};

export default config;
