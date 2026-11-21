import { page } from '$app/state';

import { fmt, messages, type ErrorKey, type Locale } from './i18n';

// Only written in the browser; module state would otherwise leak across SSR requests
let override = $state<Locale | null>(null);

export const i18n = {
	get locale(): Locale {
		return override ?? page.data.locale;
	},
	get m() {
		return messages[this.locale];
	}
};

// Switches in place: a reload or refreshAll would lose a revealed one-time paste or a fresh share key
export const setLocale = (locale: Locale) => {
	override = locale;
	document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
	document.documentElement.lang = locale;
};

export const errorText = (error: ErrorKey, max?: number) => fmt(i18n.m.errors[error], { max });
