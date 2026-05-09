<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import hljs from 'highlight.js';

	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import type { Action } from 'svelte/action';

	import { decryptPayload } from '$lib/crypto';

	type PastePayload = {
		id: string;
		title: string | null;
		content: string | null;
		contentIv: string | null;
		language: string;
		createdAt: string | Date;
		expiresAt: string | Date;
		onetime: boolean;
		requiresPassword: boolean;
		encrypted: boolean;
	};

	type ActionForm = {
		content?: string;
		contentIv?: string;
		error?: string;
	} | null;

	type PageProps = {
		data: { paste: PastePayload };
		form: ActionForm;
	};

	let { data, form }: PageProps = $props();

	let copied = $state(false);
	let lastHighlighted = $state('');
	let passwordValue = $state('');
	let decryptedContent = $state('');
	let decryptedTitle = $state<string | null>(null);
	let decryptError = $state<string | null>(null);
	let keyFromHash = $state<string | null>(null);
	const rootPath = '/' as const;

	const plainContent = $derived(form?.content ?? data.paste.content ?? '');
	const cipherText = $derived(form?.content ?? data.paste.content ?? '');
	const cipherIv = $derived(form?.contentIv ?? data.paste.contentIv ?? '');
	const isEncrypted = $derived(Boolean(data.paste.encrypted));
	const hasCipherPayload = $derived(Boolean(cipherText && cipherIv));
	const isOnetime = $derived(data.paste.onetime);
	const hasPayload = $derived(isEncrypted ? hasCipherPayload : Boolean(plainContent));
	const shouldReveal = $derived(!isOnetime || hasPayload);
	const isLocked = $derived(data.paste.requiresPassword && !hasPayload && !isOnetime);
	const createdAt = $derived(new Date(data.paste.createdAt));
	const expiresAt = $derived(new Date(data.paste.expiresAt));
	const pasteContent = $derived(isEncrypted ? decryptedContent : plainContent);
	const displayTitle = $derived(
		isEncrypted
			? (decryptedTitle ?? 'Verschlüsselte Nachricht')
			: (data.paste.title ?? 'Unbenannte Nachricht')
	);
	const lineCount = $derived(pasteContent ? pasteContent.split('\n').length : 0);

	const consumeSubmit: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update({ invalidateAll: false });
				return;
			}
			await update();
		};
	};

	const consumeEnhance: Action<HTMLFormElement> = (form) => enhance(form, consumeSubmit);

	const copyPasteContent = async () => {
		if (!pasteContent) return;
		await navigator.clipboard.writeText(pasteContent);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	};

	const highlight = async () => {
		await tick();
		const blocks = document.querySelectorAll('pre code');
		blocks.forEach((block) => {
			const element = block as HTMLElement;
			element.dataset.highlighted = '';
			element.textContent = pasteContent;
			hljs.highlightElement(element);
		});
	};

	onMount(() => {
		const updateKey = () => {
			const hash = window.location.hash.startsWith('#')
				? window.location.hash.slice(1)
				: window.location.hash;
			const params = new URLSearchParams(hash);
			keyFromHash = params.get('key');
		};
		updateKey();
		window.addEventListener('hashchange', updateKey);
		return () => window.removeEventListener('hashchange', updateKey);
	});

	$effect(() => {
		if (!isLocked && shouldReveal && pasteContent && pasteContent !== lastHighlighted) {
			lastHighlighted = pasteContent;
			highlight();
		}
	});

	const decryptIfPossible = async (
		activeCipherText: string,
		activeCipherIv: string,
		activeKey: string | null
	) => {
		if (!activeCipherText || !activeCipherIv) {
			decryptError = null;
			return;
		}
		if (!activeKey) {
			decryptError = 'Verschlüsselungsschlüssel fehlt.';
			return;
		}
		try {
			decryptError = null;
			const payload = await decryptPayload({
				cipherText: activeCipherText,
				iv: activeCipherIv,
				key: activeKey
			});
			decryptedContent = payload.content;
			decryptedTitle = payload.title;
		} catch (error) {
			console.error('Decryption failed:', error);
			decryptError = 'Diese Nachricht konnte nicht entschlüsselt werden.';
		}
	};

	$effect(() => {
		if (!isEncrypted) return;
		const activeCipherText = cipherText;
		const activeCipherIv = cipherIv;
		const activeKey = keyFromHash;
		decryptedContent = '';
		decryptedTitle = null;
		void decryptIfPossible(activeCipherText, activeCipherIv, activeKey);
	});

	function formatDate(date: Date): string {
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{displayTitle} - whisperbin</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-16">
	<!-- Back -->
	<a
		href={resolve(rootPath)}
		class="text-xs font-medium tracking-wide text-muted uppercase transition-colors hover:text-secondary"
	>
		← Neue Nachricht
	</a>

	<!-- Header -->
	<header class="flex flex-col gap-3">
		<h1 class="text-2xl">{displayTitle}</h1>
		<div class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
			<span>{data.paste.id.slice(0, 8)}</span>
			<span>{data.paste.language}</span>
			<span>{lineCount} Zeilen</span>
			{#if isOnetime}
				<span class="text-danger">Einmalig</span>
			{/if}
			<span>Erstellt {formatDate(createdAt)}</span>
			<span>Läuft ab {formatDate(expiresAt)}</span>
		</div>
	</header>

	<noscript>
		<div
			class="rounded-sm border border-line bg-canvas px-4 py-3 text-sm text-secondary"
			role="alert"
		>
			JavaScript wird benötigt, um verschlüsselte Nachrichten zu entschlüsseln.
		</div>
	</noscript>

	<!-- Password locked -->
	{#if isLocked}
		<div class="flex gap-0">
			<div class="hidden w-1 shrink-0 bg-accent sm:block"></div>
			<section class="flex grow flex-col gap-5 border border-line bg-surface p-6 sm:px-8 sm:py-8">
				<div>
					<h2 class="text-lg">Passwort erforderlich</h2>
					<p class="mt-1 text-sm text-secondary">
						Gib das Passwort ein, um diese Nachricht zu entschlüsseln.
					</p>
				</div>

				{#if form?.error}
					<div
						class="rounded-sm border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
						role="alert"
					>
						{form.error}
					</div>
				{/if}

				<form method="POST" action="?/unlock" use:consumeEnhance class="flex flex-col gap-3">
					<input
						name="password"
						type="password"
						autocomplete="current-password"
						placeholder="Passwort eingeben"
						class="rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
					/>
					<button
						type="submit"
						class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-accent-hover"
					>
						Nachricht entsperren
					</button>
				</form>
			</section>
		</div>

		<!-- One-time confirmation -->
	{:else if isOnetime && !shouldReveal}
		<div class="flex gap-0">
			<div class="hidden w-1 shrink-0 bg-danger sm:block"></div>
			<section class="flex grow flex-col gap-5 border border-line bg-surface p-6 sm:px-8 sm:py-8">
				<div>
					<h2 class="text-lg">Einmalige Nachricht</h2>
					<p class="mt-1 text-sm text-secondary">
						Diese Nachricht wird nach dem Öffnen dauerhaft gelöscht.
					</p>
				</div>

				{#if form?.error}
					<div
						class="rounded-sm border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
						role="alert"
					>
						{form.error}
					</div>
				{/if}

				<form method="POST" action="?/consume" use:consumeEnhance class="flex flex-col gap-3">
					{#if data.paste.requiresPassword}
						<input
							name="password"
							type="password"
							autocomplete="current-password"
							placeholder="Passwort eingeben"
							bind:value={passwordValue}
							class="rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-danger focus:outline-none"
						/>
					{/if}
					<button
						type="submit"
						class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-danger px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:opacity-90"
					>
						Anzeigen und löschen
					</button>
				</form>
			</section>
		</div>

		<!-- Content display -->
	{:else}
		<section class="flex gap-0">
			<div class="hidden w-1 shrink-0 bg-accent sm:block"></div>
			<div class="flex grow flex-col overflow-hidden border border-line bg-surface">
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3"
				>
					<span class="font-mono text-xs text-muted">{data.paste.language}</span>
					<button
						type="button"
						onclick={copyPasteContent}
						class="inline-flex cursor-pointer items-center rounded-sm border border-line bg-canvas px-3 py-1.5 font-mono text-xs tracking-wide text-secondary uppercase transition-colors hover:border-accent hover:text-accent"
					>
						{#if copied}
							Kopiert
						{:else}
							Kopieren
						{/if}
					</button>
				</div>
				{#if decryptError}
					<div class="px-5 py-8 text-center text-sm text-danger" role="alert">
						{decryptError}
					</div>
				{:else}
					<pre class="overflow-x-auto px-5 py-5 text-sm leading-relaxed">
						<code class={`language-${data.paste.language}`}>{pasteContent}</code>
					</pre>
				{/if}
			</div>
		</section>

		<div class="flex justify-end">
			<a
				href={resolve(rootPath)}
				class="inline-flex items-center rounded-sm border border-line bg-canvas px-4 py-2 text-xs font-semibold tracking-wide text-secondary uppercase transition-colors hover:border-accent hover:text-accent"
			>
				Eigene Nachricht erstellen
			</a>
		</div>
	{/if}
</main>
