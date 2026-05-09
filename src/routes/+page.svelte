<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';

	import { encryptPayload } from '$lib/crypto';
	import { EXPIRATION_OPTIONS, LANGUAGE_OPTIONS } from '$lib/paste-options';

	type FormValues = {
		title?: string | null;
		content?: string | null;
		expiresIn?: string | null;
		language?: string | null;
		onetime?: string | null;
		encrypted?: string | null;
	};

	type ActionForm = {
		id?: string;
		error?: string;
		values?: FormValues;
	} | null;

	type PageProps = {
		data: { origin: string };
		form: ActionForm;
	};

	const MAX_TITLE_LENGTH = 120;
	const MAX_CONTENT_LENGTH = 20000;
	const MAX_PASSWORD_LENGTH = 200;

	let { data, form }: PageProps = $props();

	const values = $derived(form?.values ?? {});
	let selectedExpiry = $state('24h');
	let selectedLanguage = $state('plaintext');
	let onetimeEnabled = $state(false);
	let titleValue = $state('');
	let contentValue = $state('');
	let encryptionKey = $state<string | null>(null);
	let clientError = $state<string | null>(null);
	let encrypting = $state(false);

	$effect(() => {
		if (values.expiresIn) selectedExpiry = values.expiresIn;
		if (values.language) selectedLanguage = values.language;
		if (values.onetime !== undefined) onetimeEnabled = values.onetime === 'on';
		if (values.encrypted !== '1') {
			if (values.title !== undefined) titleValue = values.title ?? '';
			if (values.content !== undefined) contentValue = values.content ?? '';
		}
	});

	const selectedExpiryLabel = $derived(
		EXPIRATION_OPTIONS.find((o) => o.value === selectedExpiry)?.label ?? selectedExpiry
	);
	const sharePath = $derived(form?.id ? `/${form.id}` : null);
	const shareUrl = $derived(
		sharePath && encryptionKey
			? `${data.origin}${resolve(sharePath as '/')}#key=${encryptionKey}`
			: null
	);
	let copied = $state(false);

	const encryptSubmit: SubmitFunction = async ({ formData, cancel }) => {
		clientError = null;
		encryptionKey = null;

		const trimmedTitle = titleValue.trim();
		const trimmedContent = contentValue.trim();

		if (!trimmedContent) {
			clientError = 'Bitte gib einen Inhalt ein.';
			cancel();
			return;
		}

		if (trimmedContent.length > MAX_CONTENT_LENGTH) {
			clientError = `Der Inhalt darf maximal ${MAX_CONTENT_LENGTH} Zeichen lang sein.`;
			cancel();
			return;
		}

		if (trimmedTitle.length > MAX_TITLE_LENGTH) {
			clientError = `Der Titel darf maximal ${MAX_TITLE_LENGTH} Zeichen lang sein.`;
			cancel();
			return;
		}

		const password = formData.get('password');
		if (typeof password === 'string' && password.length > MAX_PASSWORD_LENGTH) {
			clientError = `Das Passwort darf maximal ${MAX_PASSWORD_LENGTH} Zeichen lang sein.`;
			cancel();
			return;
		}

		try {
			encrypting = true;
			const encrypted = await encryptPayload({
				title: trimmedTitle.length > 0 ? trimmedTitle : null,
				content: contentValue
			});

			encryptionKey = encrypted.key;
			formData.set('content', encrypted.cipherText);
			formData.set('contentIv', encrypted.iv);
			formData.set('encrypted', '1');
			formData.set('title', '');
		} catch (error) {
			console.error('Encryption failed:', error);
			clientError = 'Verschlüsselung fehlgeschlagen. Bitte versuche es erneut.';
			cancel();
			return;
		} finally {
			encrypting = false;
		}

		return async ({ result, update }) => {
			if (result.type === 'success') {
				titleValue = '';
				contentValue = '';
			}
			await update();
		};
	};

	const encryptEnhance = (formElement: HTMLFormElement) => enhance(formElement, encryptSubmit);

	const copyShareUrl = async () => {
		if (!shareUrl) return;
		await navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	};
</script>

<svelte:head>
	<title>whisperbin — vertrauliche Nachrichten teilen</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-xl flex-col gap-12 px-6 py-20">
	<!-- Header -->
	<header class="flex flex-col gap-3">
		<p class="text-xs font-medium tracking-wide text-muted uppercase">whisperbin</p>
		<h1 class="text-3xl">Vertrauliche Nachrichten teilen</h1>
		<p class="max-w-md text-sm leading-relaxed text-secondary">
			Ende-zu-Ende verschlüsselt in deinem Browser. Der Schlüssel verlässt dein Gerät nie. Die
			Nachricht löscht sich automatisch nach Ablauf.
		</p>
	</header>

	<!-- Errors -->
	<noscript>
		<div
			class="rounded-sm border border-line bg-canvas px-4 py-3 text-sm text-secondary"
			role="alert"
		>
			JavaScript wird benötigt, um Nachrichten zu verschlüsseln und zu erstellen.
		</div>
	</noscript>

	{#if clientError}
		<div
			class="rounded-sm border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
			role="alert"
		>
			{clientError}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-sm border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
			role="alert"
		>
			{form.error}
		</div>
	{/if}

	<!-- Form -->
	<div class="flex gap-0">
		<div class="hidden w-1 shrink-0 bg-accent sm:block"></div>
		<form
			method="POST"
			use:encryptEnhance
			class="flex grow flex-col gap-6 border border-line bg-surface p-6 sm:px-8 sm:py-8"
		>
			<div class="flex flex-col gap-2">
				<label class="text-xs font-semibold tracking-wide text-muted uppercase" for="title"
					>Titel <span class="font-normal lowercase">(optional)</span></label
				>
				<input
					id="title"
					name="title"
					placeholder="Z. B. Zugangsdaten für Projekt Alpha"
					maxlength={MAX_TITLE_LENGTH}
					class="rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
					bind:value={titleValue}
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class="text-xs font-semibold tracking-wide text-muted uppercase" for="content"
					>Inhalt</label
				>
				<textarea
					id="content"
					name="content"
					rows="10"
					required
					maxlength={MAX_CONTENT_LENGTH}
					placeholder="Füge deine Nachricht hier ein …"
					class="resize-y rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
					bind:value={contentValue}
				></textarea>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-2">
					<label class="text-xs font-semibold tracking-wide text-muted uppercase" for="expiresIn"
						>Läuft ab in</label
					>
					<select
						id="expiresIn"
						name="expiresIn"
						required
						bind:value={selectedExpiry}
						class="cursor-pointer rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
					>
						{#each EXPIRATION_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-xs font-semibold tracking-wide text-muted uppercase" for="language"
						>Format</label
					>
					<select
						id="language"
						name="language"
						required
						bind:value={selectedLanguage}
						class="cursor-pointer rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
					>
						{#each LANGUAGE_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<label class="text-xs font-semibold tracking-wide text-muted uppercase" for="password"
					>Passwort <span class="font-normal lowercase">(optional)</span></label
				>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					maxlength={MAX_PASSWORD_LENGTH}
					placeholder="Zusätzlicher Passwortschutz"
					class="rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
				/>
				<p class="text-xs text-muted">
					Leer lassen, damit jeder mit dem Link die Nachricht öffnen kann.
				</p>
			</div>

			<label class="flex cursor-pointer items-start gap-3 border border-line bg-canvas px-4 py-3">
				<input
					class="mt-1 h-4 w-4 cursor-pointer rounded-sm border-line bg-canvas text-accent focus:ring-0 focus:ring-offset-0"
					type="checkbox"
					name="onetime"
					bind:checked={onetimeEnabled}
				/>
				<span class="flex flex-col gap-1">
					<span class="text-sm font-medium text-primary">Nach erstem Aufruf löschen</span>
					<span class="text-xs text-muted">
						Die Nachricht wird dauerhaft gelöscht, sobald sie jemand öffnet.
					</span>
				</span>
			</label>

			<button
				type="submit"
				disabled={encrypting}
				class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if encrypting}
					<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					Wird verschlüsselt …
				{:else}
					Nachricht erstellen
				{/if}
			</button>
		</form>
	</div>

	<!-- Share URL -->
	{#if shareUrl}
		<section class="flex gap-0">
			<div class="hidden w-1 shrink-0 bg-success sm:block"></div>
			<div
				class="flex grow flex-col gap-3 border border-line-strong bg-surface p-6 sm:px-8 sm:py-8"
			>
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-semibold text-primary">Link bereit</span>
					<span
						class="rounded-sm border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-secondary"
						>{selectedExpiryLabel}</span
					>
				</div>
				<code
					class="block rounded-sm border border-line bg-canvas px-3 py-2.5 font-mono text-sm break-all text-primary"
					>{shareUrl}</code
				>
				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={copyShareUrl}
						class="inline-flex cursor-pointer items-center rounded-sm border border-line bg-canvas px-4 py-2 text-xs font-semibold tracking-wide text-secondary uppercase transition-colors hover:border-accent hover:text-accent"
					>
						{#if copied}
							Kopiert
						{:else}
							Kopieren
						{/if}
					</button>
				</div>
				<p class="text-xs leading-relaxed text-muted">
					Dieser Link enthält den Schlüssel zum Entschlüsseln. Teile ihn nur mit der Person, die die
					Nachricht lesen soll.
				</p>
			</div>
		</section>
	{/if}
</main>
