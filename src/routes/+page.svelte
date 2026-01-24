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
		if (values.expiresIn) {
			selectedExpiry = values.expiresIn;
		}

		if (values.language) {
			selectedLanguage = values.language;
		}

		if (values.onetime !== undefined) {
			onetimeEnabled = values.onetime === 'on';
		}

		if (values.encrypted !== '1') {
			if (values.title !== undefined) {
				titleValue = values.title ?? '';
			}

			if (values.content !== undefined) {
				contentValue = values.content ?? '';
			}
		}
	});
	const selectedExpiryLabel = $derived(
		EXPIRATION_OPTIONS.find((option) => option.value === selectedExpiry)?.label ?? selectedExpiry
	);
	const selectedLanguageLabel = $derived(
		LANGUAGE_OPTIONS.find((option) => option.value === selectedLanguage)?.label ?? selectedLanguage
	);
	const onetimeLabel = $derived(onetimeEnabled ? 'EINMALIG' : 'STANDARD');
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
			clientError = 'Inhalt ist erforderlich.';
			cancel();
			return;
		}

		if (trimmedContent.length > MAX_CONTENT_LENGTH) {
			clientError = `Inhalt muss unter ${MAX_CONTENT_LENGTH} Zeichen sein.`;
			cancel();
			return;
		}

		if (trimmedTitle.length > MAX_TITLE_LENGTH) {
			clientError = `Titel muss unter ${MAX_TITLE_LENGTH} Zeichen sein.`;
			cancel();
			return;
		}

		const password = formData.get('password');
		if (typeof password === 'string' && password.length > MAX_PASSWORD_LENGTH) {
			clientError = `Passwort muss unter ${MAX_PASSWORD_LENGTH} Zeichen sein.`;
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
			clientError = 'Verschlüsselung fehlgeschlagen.';
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
		setTimeout(() => {
			copied = false;
		}, 1500);
	};
</script>

<svelte:head>
	<title>whiserpbin</title>
</svelte:head>

<main class="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
	<header class="flex flex-col gap-4">
		<p class="text-xs tracking-[0.35em] text-emerald-300/70 uppercase">whiserpbin</p>
		<h1 class="text-4xl font-semibold text-emerald-100">Verschlüsselte Pastes, die vanishen.</h1>
		<p class="max-w-xl text-sm text-emerald-100/70">
			Teile Secrets oder Texte. Client-seitige AES-Verschlüsselung, optionale Passwörter und
			selbstzerstörende Pastes.
		</p>
		<div class="flex flex-wrap gap-3 text-xs text-emerald-200/70">
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				TTL {selectedExpiryLabel}
			</span>
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				LANG {selectedLanguageLabel}
			</span>
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				{onetimeLabel}
			</span>
		</div>
	</header>
	<noscript>
		<div
			class="rounded-2xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
			role="alert"
		>
			JavaScript wird benötigt, um Pastes zu verschlüsseln und zu erstellen.
		</div>
	</noscript>

	{#if clientError}
		<div
			class="rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200"
			role="alert"
		>
			{clientError}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200"
			role="alert"
		>
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		use:encryptEnhance
		class="flex flex-col gap-6 rounded-2xl border border-emerald-500/20 bg-black/40 p-6 shadow-[0_0_0_1px_rgba(98,243,174,0.12),0_30px_80px_rgba(0,0,0,0.6)]"
	>
		<div
			class="flex items-center gap-3 border-b border-emerald-500/15 pb-4 text-xs text-emerald-200/70"
		>
			<span class="h-2 w-2 rounded-full bg-rose-500/80"></span>
			<span class="h-2 w-2 rounded-full bg-amber-400/80"></span>
			<span class="h-2 w-2 rounded-full bg-emerald-400/80"></span>
			<span class="ml-2 tracking-[0.3em] uppercase">Neuer Paste</span>
			<span class="ml-auto text-emerald-300/60">Sitzung aktiv</span>
		</div>

		<div class="flex flex-col gap-2">
			<label
				class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
				for="title"
			>
				Titel (optional)
			</label>
			<input
				id="title"
				name="title"
				placeholder="Total geheimes Geheimnis"
				maxlength={MAX_TITLE_LENGTH}
				class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				bind:value={titleValue}
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label
				class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
				for="content"
			>
				Inhalt
			</label>
			<textarea
				id="content"
				name="content"
				rows="12"
				required
				maxlength={MAX_CONTENT_LENGTH}
				placeholder="Füge deinen Inhalt hier ein..."
				class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				bind:value={contentValue}
			></textarea>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<label
					class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
					for="expiresIn"
				>
					Läuft ab in
				</label>
				<select
					id="expiresIn"
					name="expiresIn"
					required
					bind:value={selectedExpiry}
					class="cursor-pointer rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				>
					{#each EXPIRATION_OPTIONS as option (option.value)}
						<option value={option.value}>
							{option.label}
						</option>
					{/each}
				</select>
			</div>
			<div class="flex flex-col gap-2">
				<label
					class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
					for="language"
				>
					Dateityp
				</label>
				<select
					id="language"
					name="language"
					required
					bind:value={selectedLanguage}
					class="cursor-pointer rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				>
					{#each LANGUAGE_OPTIONS as option (option.value)}
						<option value={option.value}>
							{option.label}
						</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<label
				class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
				for="password"
			>
				Passwort (optional)
			</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="new-password"
				maxlength={MAX_PASSWORD_LENGTH}
				placeholder="Diesen Paste schützen"
				class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
			/>
			<p class="text-xs text-emerald-200/50">Leer lassen für öffentlichen Zugang.</p>
		</div>

		<label
			class="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-500/20 bg-black/30 px-4 py-3 text-sm text-emerald-100/80"
		>
			<input
				class="mt-1 h-4 w-4 cursor-pointer rounded border-emerald-500/40 bg-black/40 text-emerald-300 focus:ring-emerald-400/40"
				type="checkbox"
				name="onetime"
				bind:checked={onetimeEnabled}
			/>
			<span class="flex flex-col gap-1">
				<span class="text-xs font-semibold tracking-[0.25em] text-emerald-200 uppercase">
					Nach erstem Aufruf löschen
				</span>
				<span class="text-xs text-emerald-200/50">
					Der Betrachter muss bestätigen, bevor der Paste angezeigt wird.
				</span>
			</span>
		</label>

		<button
			type="submit"
			disabled={encrypting}
			class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-[0_0_0_rgba(82,255,174,0)] transition hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-[0_16px_30px_-18px_rgba(82,255,174,0.8)]"
		>
			{encrypting ? 'Verschlüssele...' : 'Paste erstellen'}
		</button>
	</form>

	{#if shareUrl}
		<section
			class="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 shadow-[0_0_40px_rgba(82,255,174,0.16)]"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 text-xs tracking-[0.2em] text-emerald-200/70 uppercase"
			>
				<span>Link bereit</span>
				<span>GÜLTIG {selectedExpiry}</span>
			</div>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<a
					class="block text-sm break-all text-emerald-100"
					href={resolve((sharePath ?? '/') as '/')}
					onclick={(event) => {
						event.preventDefault();
						if (shareUrl) {
							window.location.href = shareUrl;
						}
					}}
				>
					{shareUrl}
				</a>
				<button
					type="button"
					onclick={copyShareUrl}
					class="inline-flex cursor-pointer items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-950/40 px-3 py-1 text-xs tracking-[0.2em] text-emerald-200 uppercase transition hover:border-emerald-200 hover:text-emerald-100"
				>
					{copied ? 'Kopiert' : 'Kopieren'}
				</button>
				<span class="sr-only" aria-live="polite">
					{copied ? 'Link in Zwischenablage kopiert.' : ''}
				</span>
			</div>

			<p class="mt-3 text-xs text-emerald-200/60">
				Dieser Link enthält den Verschlüsselungsschlüssel. Jeder mit diesem Link kann den Paste
				entschlüsseln.
			</p>
		</section>
	{/if}
</main>
