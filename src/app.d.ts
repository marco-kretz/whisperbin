import type { Locale } from '#lib/i18n.js';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			locale: Locale;
		}
		interface PageData {
			locale: Locale;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
