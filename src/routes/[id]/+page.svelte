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
			? (decryptedTitle ?? 'Verschlüsselter Paste')
			: (data.paste.title ?? 'Unbenannter Paste')
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
		setTimeout(() => {
			copied = false;
		}, 1500);
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

		return () => {
			window.removeEventListener('hashchange', updateKey);
		};
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
			decryptError = 'Dieser Paste konnte nicht entschlüsselt werden.';
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
</script>

<svelte:head>
	<title>{displayTitle} · whiserpbin</title>
</svelte:head>

<main class="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
	<header class="flex flex-col gap-4">
		<a
			href={resolve(rootPath)}
			class="text-xs tracking-[0.35em] text-emerald-300/70 uppercase transition-colors hover:text-emerald-200"
		>
			whiserpbin
		</a>
		<h1 class="text-4xl font-semibold text-emerald-100">{displayTitle}</h1>
		<div class="flex flex-wrap gap-3 text-xs text-emerald-200/70">
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				ID {data.paste.id}
			</span>
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				SPRACHE {data.paste.language}
			</span>
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				ZEILEN {lineCount}
			</span>
			{#if isOnetime}
				<span
					class="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-rose-200/80"
				>
					EINMALIG
				</span>
			{/if}
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				Erstellt <time datetime={createdAt.toISOString()}>{createdAt.toLocaleString()}</time>
			</span>
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				Läuft ab <time datetime={expiresAt.toISOString()}>{expiresAt.toLocaleString()}</time>
			</span>
		</div>
	</header>
	<noscript>
		<div
			class="rounded-2xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
			role="alert"
		>
			JavaScript wird benötigt, um verschlüsselte Pastes zu entschlüsseln und anzuzeigen.
		</div>
	</noscript>

	{#if isLocked}
		<section
			class="rounded-2xl border border-emerald-500/20 bg-black/40 p-6 shadow-[0_0_0_1px_rgba(98,243,174,0.12),0_30px_80px_rgba(0,0,0,0.6)]"
		>
			<h2 class="text-lg font-semibold text-emerald-100">Passwort erforderlich</h2>
			<p class="mt-2 text-sm text-emerald-100/60">
				Gib das Passwort ein, um diesen Paste freizuschalten.
			</p>

			{#if form?.error}
				<div
					class="mt-4 rounded-xl border border-red-500/30 bg-red-950/50 px-3 py-2 text-sm text-red-200"
					role="alert"
				>
					{form.error}
				</div>
			{/if}

			<form method="POST" action="?/unlock" use:consumeEnhance class="mt-4 flex flex-col gap-3">
				<input
					name="password"
					type="password"
					autocomplete="current-password"
					placeholder="Paste-Passwort"
					class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				/>
				<button
					type="submit"
					class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
				>
					Paste freischalten
				</button>
			</form>
		</section>
	{:else if isOnetime && !shouldReveal}
		<section
			class="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 shadow-[0_0_0_1px_rgba(244,63,94,0.15),0_30px_80px_rgba(0,0,0,0.6)]"
		>
			<h2 class="text-lg font-semibold text-rose-100">Einmaliger Paste</h2>
			<p class="mt-2 text-sm text-rose-100/70">
				Dieser Paste wird vom Server gelöscht, sobald du ihn anzeigst.
			</p>

			{#if form?.error}
				<div
					class="mt-4 rounded-xl border border-red-500/30 bg-red-950/50 px-3 py-2 text-sm text-red-200"
					role="alert"
				>
					{form.error}
				</div>
			{/if}

			<form method="POST" action="?/consume" use:consumeEnhance class="mt-4 flex flex-col gap-3">
				{#if data.paste.requiresPassword}
					<input
						name="password"
						type="password"
						autocomplete="current-password"
						placeholder="Paste-Passwort"
						bind:value={passwordValue}
						class="rounded-lg border border-rose-500/30 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/40 focus:outline-none"
					/>
				{/if}
				<button
					type="submit"
					class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-rose-300 px-4 py-2 text-sm font-semibold text-rose-950 transition hover:bg-rose-200"
				>
					Anzeigen und löschen
				</button>
			</form>
		</section>
	{:else}
		<section
			class="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/50 shadow-[0_0_0_1px_rgba(98,243,174,0.12),0_30px_80px_rgba(0,0,0,0.6)]"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 px-4 py-3 text-xs tracking-[0.2em] text-emerald-200/70 uppercase"
			>
				<span>Ausgabe</span>
				<div class="flex items-center gap-3">
					<span>{data.paste.language}</span>
					<button
						type="button"
						onclick={copyPasteContent}
						class="cursor-pointer rounded-full border border-emerald-300/60 bg-emerald-950/40 px-3 py-1 text-[10px] tracking-[0.2em] text-emerald-200 transition hover:border-emerald-200 hover:text-emerald-100"
					>
						{copied ? 'Kopiert' : 'Kopieren'}
					</button>
					<span class="sr-only" aria-live="polite">
						{copied ? 'Inhalt in Zwischenablage kopiert.' : ''}
					</span>
				</div>
			</div>
			{#if decryptError}
				<div class="px-4 py-5 text-sm text-rose-200" role="alert">
					{decryptError}
				</div>
			{:else}
				<pre class="overflow-x-auto px-4 py-5 text-sm leading-relaxed">
					<code class={`language-${data.paste.language}`}>{pasteContent}</code>
				</pre>
			{/if}
		</section>
		<div class="flex justify-end">
			<a
				href={resolve(rootPath)}
				class="inline-flex items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-950/40 px-4 py-2 text-xs tracking-[0.2em] text-emerald-200 uppercase transition hover:border-emerald-200 hover:text-emerald-100"
			>
				Eigenen Paste erstellen
			</a>
		</div>
	{/if}
</main>
