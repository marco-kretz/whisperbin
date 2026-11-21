import type { ExpirationValue } from './paste-options';

export const LOCALES = ['en', 'de'] as const;

export type Locale = (typeof LOCALES)[number];

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

const en = {
	languageSwitch: 'Language',
	copy: 'Copy',
	copied: 'Copied',
	back: '← Back',
	footer: { imprint: 'Legal notice', privacy: 'Privacy' },
	notFound: 'Paste not found',
	genericError: 'Something went wrong',
	expiry: {
		'1h': '1 hour',
		'6h': '6 hours',
		'24h': '24 hours',
		'7d': '7 days'
	} satisfies Record<ExpirationValue, string>,
	create: {
		pageTitle: 'whisperbin — share confidential messages',
		heading: 'Share confidential messages',
		features: [
			{ title: 'End-to-end encrypted', text: 'Encrypted right in your browser' },
			{ title: 'Your key stays with you', text: 'It lives only in the link, never on the server' },
			{ title: 'Deleted automatically', text: 'Once the chosen time runs out' },
			{ title: 'Read once, then gone', text: 'Optionally deleted after the first view' }
		],
		noscript: 'JavaScript is required to encrypt and create messages.',
		title: 'Title',
		optional: '(optional)',
		titlePlaceholder: 'e.g. credentials for Project Alpha',
		content: 'Content',
		contentPlaceholder: 'Paste your message here …',
		generator: 'Generate password',
		length: 'Length',
		lengthAria: 'Password length',
		symbols: 'Symbols',
		generate: 'Generate',
		regenerate: 'Regenerate',
		insert: 'Insert into content',
		expiresIn: 'Expires in',
		format: 'Format',
		password: 'Password',
		passwordPlaceholder: 'Additional password protection',
		onetime: 'Delete after first view',
		onetimeHint: 'The message is permanently deleted as soon as someone opens it.',
		encrypting: 'Encrypting …',
		submit: 'Create message',
		linkReady: 'Link ready',
		shareHint:
			'This link contains the decryption key. Only share it with the person meant to read the message.'
	},
	view: {
		encryptedTitle: 'Encrypted message',
		untitled: 'Untitled message',
		newMessage: '← New message',
		lines: '{count} lines',
		oneLine: '1 line',
		onetimeBadge: 'One-time',
		created: 'Created {date}',
		expires: 'Expires {date}',
		noscript: 'JavaScript is required to decrypt encrypted messages.',
		passwordTitle: 'Password required',
		passwordHint: 'Enter the password to decrypt this message.',
		passwordPlaceholder: 'Enter password',
		unlock: 'Unlock message',
		onetimeTitle: 'One-time message',
		onetimeHint: 'This message is permanently deleted once it is opened.',
		reveal: 'Show and delete',
		createOwn: 'Create your own message'
	},
	errors: {
		requestTooLarge: 'Request is too large.',
		tooManyRequests: 'Too many requests. Please try again later.',
		tooManyAttempts: 'Too many attempts. Please try again later.',
		titleTooLong: 'The title may be at most {max} characters long.',
		contentTooLong: 'The content may be at most {max} characters long.',
		passwordTooLong: 'The password may be at most {max} characters long.',
		contentRequired: 'Please enter some content.',
		e2eRequired: 'End-to-end encryption is required.',
		cipherTooLarge: 'Encrypted data is too large.',
		expiryRequired: 'Expiration is required.',
		expiryInvalid: 'Expiration is invalid.',
		formatInvalid: 'Format is invalid.',
		encryptionFailed: 'Encryption failed. Please try again.',
		useOnetime: 'Use the one-time view to open this paste.',
		notOnetime: 'This paste is not a one-time paste.',
		passwordRequired: 'Password is required.',
		wrongPassword: 'Wrong password.',
		accessDenied: 'Access denied.',
		missingKey: 'Encryption key is missing.',
		decryptFailed: 'This message could not be decrypted.'
	}
};

const de: typeof en = {
	languageSwitch: 'Sprache',
	copy: 'Kopieren',
	copied: 'Kopiert',
	back: '← Zurück',
	footer: { imprint: 'Impressum', privacy: 'Datenschutz' },
	notFound: 'Paste nicht gefunden',
	genericError: 'Etwas ist schiefgelaufen',
	expiry: {
		'1h': '1 Stunde',
		'6h': '6 Stunden',
		'24h': '24 Stunden',
		'7d': '7 Tage'
	},
	create: {
		pageTitle: 'whisperbin — vertrauliche Nachrichten teilen',
		heading: 'Vertrauliche Nachrichten teilen',
		features: [
			{ title: 'Ende-zu-Ende verschlüsselt', text: 'Verschlüsselung direkt in deinem Browser' },
			{ title: 'Schlüssel bleibt bei dir', text: 'Er steckt nur im Link, nie auf dem Server' },
			{ title: 'Automatisch gelöscht', text: 'Nach Ablauf der gewählten Zeit' },
			{ title: 'Einmal lesen, dann weg', text: 'Optional nach dem ersten Aufruf löschen' }
		],
		noscript: 'JavaScript wird benötigt, um Nachrichten zu verschlüsseln und zu erstellen.',
		title: 'Titel',
		optional: '(optional)',
		titlePlaceholder: 'Z. B. Zugangsdaten für Projekt Alpha',
		content: 'Inhalt',
		contentPlaceholder: 'Füge deine Nachricht hier ein …',
		generator: 'Passwort generieren',
		length: 'Länge',
		lengthAria: 'Passwortlänge',
		symbols: 'Sonderzeichen',
		generate: 'Generieren',
		regenerate: 'Neu generieren',
		insert: 'In Inhalt einfügen',
		expiresIn: 'Läuft ab in',
		format: 'Format',
		password: 'Passwort',
		passwordPlaceholder: 'Zusätzlicher Passwortschutz',
		onetime: 'Nach erstem Aufruf löschen',
		onetimeHint: 'Die Nachricht wird dauerhaft gelöscht, sobald sie jemand öffnet.',
		encrypting: 'Wird verschlüsselt …',
		submit: 'Nachricht erstellen',
		linkReady: 'Link bereit',
		shareHint:
			'Dieser Link enthält den Schlüssel zum Entschlüsseln. Teile ihn nur mit der Person, die die Nachricht lesen soll.'
	},
	view: {
		encryptedTitle: 'Verschlüsselte Nachricht',
		untitled: 'Unbenannte Nachricht',
		newMessage: '← Neue Nachricht',
		lines: '{count} Zeilen',
		oneLine: '1 Zeile',
		onetimeBadge: 'Einmalig',
		created: 'Erstellt {date}',
		expires: 'Läuft ab {date}',
		noscript: 'JavaScript wird benötigt, um verschlüsselte Nachrichten zu entschlüsseln.',
		passwordTitle: 'Passwort erforderlich',
		passwordHint: 'Gib das Passwort ein, um diese Nachricht zu entschlüsseln.',
		passwordPlaceholder: 'Passwort eingeben',
		unlock: 'Nachricht entsperren',
		onetimeTitle: 'Einmalige Nachricht',
		onetimeHint: 'Diese Nachricht wird nach dem Öffnen dauerhaft gelöscht.',
		reveal: 'Anzeigen und löschen',
		createOwn: 'Eigene Nachricht erstellen'
	},
	errors: {
		requestTooLarge: 'Anfrage ist zu groß.',
		tooManyRequests: 'Zu viele Anfragen. Bitte versuche es später erneut.',
		tooManyAttempts: 'Zu viele Versuche. Bitte versuche es später erneut.',
		titleTooLong: 'Der Titel darf maximal {max} Zeichen lang sein.',
		contentTooLong: 'Der Inhalt darf maximal {max} Zeichen lang sein.',
		passwordTooLong: 'Das Passwort darf maximal {max} Zeichen lang sein.',
		contentRequired: 'Bitte gib einen Inhalt ein.',
		e2eRequired: 'Ende-zu-Ende-Verschlüsselung ist erforderlich.',
		cipherTooLarge: 'Verschlüsselte Daten sind zu groß.',
		expiryRequired: 'Ablaufzeit ist erforderlich.',
		expiryInvalid: 'Ablaufzeit ist ungültig.',
		formatInvalid: 'Format ist ungültig.',
		encryptionFailed: 'Verschlüsselung fehlgeschlagen. Bitte versuche es erneut.',
		useOnetime: 'Nutze die Einmal-Anzeige, um diesen Paste aufzurufen.',
		notOnetime: 'Dieser Paste ist nicht einmalig.',
		passwordRequired: 'Passwort ist erforderlich.',
		wrongPassword: 'Falsches Passwort.',
		accessDenied: 'Zugriff verweigert.',
		missingKey: 'Verschlüsselungsschlüssel fehlt.',
		decryptFailed: 'Diese Nachricht konnte nicht entschlüsselt werden.'
	}
};

export const messages: Record<Locale, typeof en> = { en, de };

export type ErrorKey = keyof typeof en.errors;

export const fmt = (template: string, values: Record<string, string | number | undefined>) =>
	template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''));

// Cookie wins over the browser's Accept-Language; English is the fallback
export const detectLocale = (cookie: string | undefined, acceptLanguage: string | null): Locale => {
	if (isLocale(cookie)) return cookie;
	const ranked = (acceptLanguage ?? '')
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().toLowerCase().split(';');
			const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
			return { language: tag.split('-')[0], q: q ? Number(q.slice(2)) : 1 };
		})
		.filter((entry) => entry.q > 0)
		.sort((a, b) => b.q - a.q);
	return ranked.map((entry) => entry.language).find(isLocale) ?? 'en';
};
