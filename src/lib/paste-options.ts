export const EXPIRATION_OPTIONS = [
	{ label: '1 hour', value: '1h', durationMs: 60 * 60 * 1000 },
	{ label: '6 hours', value: '6h', durationMs: 6 * 60 * 60 * 1000 },
	{ label: '24 hours', value: '24h', durationMs: 24 * 60 * 60 * 1000 },
	{ label: '7 days', value: '7d', durationMs: 7 * 24 * 60 * 60 * 1000 }
] as const;

export type ExpirationValue = (typeof EXPIRATION_OPTIONS)[number]['value'];

export const getExpirationMs = (value: string) =>
	EXPIRATION_OPTIONS.find((option) => option.value === value)?.durationMs ?? null;

export const LANGUAGE_OPTIONS = [
	{ label: 'Plaintext', value: 'plaintext' },
	{ label: 'Markdown', value: 'markdown' },
	{ label: 'JavaScript', value: 'javascript' },
	{ label: 'TypeScript', value: 'typescript' },
	{ label: 'PHP', value: 'php' },
	{ label: 'JSON', value: 'json' },
	{ label: 'HTML', value: 'html' },
	{ label: 'CSS', value: 'css' },
	{ label: 'Bash', value: 'bash' }
] as const;

export type LanguageValue = (typeof LANGUAGE_OPTIONS)[number]['value'];

export const LANGUAGE_VALUES = new Set(LANGUAGE_OPTIONS.map((option) => option.value));

export const isLanguageValue = (value: string): value is LanguageValue =>
	LANGUAGE_VALUES.has(value as LanguageValue);
