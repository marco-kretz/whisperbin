<script lang="ts">
	import hljs from 'highlight.js';

	import { enhance, type SubmitFunction } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import type { Action } from 'svelte/action';

	import { decryptPayload } from '#lib/crypto.js';
	import { fmt, type ErrorKey } from '#lib/i18n.js';
	import { errorText, i18n } from '#lib/i18n.svelte.js';

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
		error?: ErrorKey;
		max?: number;
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
	let decryptError = $state<ErrorKey | null>(null);
	let keyFromHash = $state<string | null>(null);
	// Captured on submit because a successful form update resets the inputs
	let submittedPassword = $state<string | null>(null);
	let decryptRun = 0;
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
			? (decryptedTitle ?? i18n.m.view.encryptedTitle)
			: (data.paste.title ?? i18n.m.view.untitled)
	);
	const lineCount = $derived(pasteContent ? pasteContent.split('\n').length : 0);

	const consumeSubmit: SubmitFunction = ({ formData }) => {
		const password = formData.get('password');
		submittedPassword = typeof password === 'string' && password.length > 0 ? password : null;
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
		activeKey: string | null,
		activePassword: string | null
	) => {
		// PBKDF2 takes a moment, so a newer run must win over a slower stale one
		const run = ++decryptRun;
		if (!activeCipherText || !activeCipherIv) {
			decryptError = null;
			return;
		}
		if (!activeKey) {
			decryptError = 'missingKey';
			return;
		}
		try {
			decryptError = null;
			const payload = await decryptPayload({
				cipherText: activeCipherText,
				iv: activeCipherIv,
				key: activeKey,
				password: activePassword
			});
			if (run !== decryptRun) return;
			decryptedContent = payload.content;
			decryptedTitle = payload.title;
			if (isOnetime && window.location.hash) {
				void goto(resolve('/[id]', { id: data.paste.id }), {
					replace: true,
					shallow: true,
					state: page.state
				});
			}
		} catch (error) {
			if (run !== decryptRun) return;
			console.error('Decryption failed:', error);
			decryptError = 'decryptFailed';
		}
	};

	$effect(() => {
		if (!isEncrypted) return;
		const activeCipherText = cipherText;
		const activeCipherIv = cipherIv;
		const activeKey = keyFromHash;
		const activePassword = submittedPassword;
		decryptedContent = '';
		decryptedTitle = null;
		void decryptIfPossible(activeCipherText, activeCipherIv, activeKey, activePassword);
	});

	function formatDate(date: Date): string {
		return date.toLocaleDateString(i18n.locale, {
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

<main class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
	<!-- Back -->
	<a
		href={resolve(rootPath)}
		class="w-fit font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:text-accent"
	>
		{i18n.m.view.newMessage}
	</a>

	<!-- Header -->
	<header class="flex flex-col gap-3">
		<h1 class="text-3xl sm:text-4xl">{displayTitle}</h1>
		<div class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
			<span>{data.paste.id.slice(0, 8)}</span>
			<span>{data.paste.language}</span>
			<span>
				{lineCount === 1 ? i18n.m.view.oneLine : fmt(i18n.m.view.lines, { count: lineCount })}
			</span>
			{#if isOnetime}
				<span class="text-danger">{i18n.m.view.onetimeBadge}</span>
			{/if}
			<span>{fmt(i18n.m.view.created, { date: formatDate(createdAt) })}</span>
			<span>{fmt(i18n.m.view.expires, { date: formatDate(expiresAt) })}</span>
		</div>
	</header>

	<noscript>
		<div class="border border-line bg-canvas px-4 py-3 text-sm text-secondary" role="alert">
			{i18n.m.view.noscript}
		</div>
	</noscript>

	<!-- Password locked -->
	{#if isLocked}
		<div class="flex gap-0">
			<section
				class="frame flex grow flex-col gap-5 border border-line bg-surface p-6 sm:px-8 sm:py-8"
			>
				<div>
					<h2 class="text-lg">{i18n.m.view.passwordTitle}</h2>
					<p class="mt-1 text-sm text-secondary">
						{i18n.m.view.passwordHint}
					</p>
				</div>

				{#if form?.error}
					<div
						class="border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
						role="alert"
					>
						{errorText(form.error, form.max)}
					</div>
				{/if}

				<form method="POST" action="?/unlock" use:consumeEnhance class="flex flex-col gap-3">
					<input
						name="password"
						type="password"
						autocomplete="current-password"
						placeholder={i18n.m.view.passwordPlaceholder}
						class="border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
					/>
					<button
						type="submit"
						class="inline-flex cursor-pointer items-center justify-center gap-2 bg-accent px-5 py-2.5 font-display text-sm font-bold tracking-wider text-ink uppercase transition-colors cut hover:bg-primary hover:text-ink"
					>
						{i18n.m.view.unlock}
					</button>
				</form>
			</section>
		</div>

		<!-- One-time confirmation -->
	{:else if isOnetime && !shouldReveal}
		<div class="flex gap-0">
			<section
				class="frame flex grow flex-col gap-5 border border-line bg-surface p-6 sm:px-8 sm:py-8"
			>
				<div>
					<h2 class="text-lg">{i18n.m.view.onetimeTitle}</h2>
					<p class="mt-1 text-sm text-secondary">
						{i18n.m.view.onetimeHint}
					</p>
				</div>

				{#if form?.error}
					<div
						class="border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
						role="alert"
					>
						{errorText(form.error, form.max)}
					</div>
				{/if}

				<form method="POST" action="?/consume" use:consumeEnhance class="flex flex-col gap-3">
					{#if data.paste.requiresPassword}
						<input
							name="password"
							type="password"
							autocomplete="current-password"
							placeholder={i18n.m.view.passwordPlaceholder}
							bind:value={passwordValue}
							class="border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-danger focus:outline-none"
						/>
					{/if}
					<button
						type="submit"
						class="inline-flex cursor-pointer items-center justify-center gap-2 bg-danger px-5 py-2.5 font-display text-sm font-bold tracking-wider text-ink uppercase transition-colors cut hover:bg-primary"
					>
						{i18n.m.view.reveal}
					</button>
				</form>
			</section>
		</div>

		<!-- Content display -->
	{:else}
		<section class="flex gap-0">
			<div class="frame flex grow flex-col overflow-hidden border border-line bg-surface">
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3"
				>
					<span class="font-mono text-xs text-muted">{data.paste.language}</span>
					<button
						type="button"
						onclick={copyPasteContent}
						class="inline-flex cursor-pointer items-center border border-line bg-canvas px-3 py-1.5 font-display text-xs tracking-wider text-secondary uppercase transition-colors hover:border-primary hover:bg-primary hover:text-ink"
					>
						{copied ? i18n.m.copied : i18n.m.copy}
					</button>
				</div>
				{#if decryptError}
					<div class="px-5 py-8 text-center text-sm text-danger" role="alert">
						{errorText(decryptError)}
					</div>
				{:else}
					<pre class="overflow-x-auto px-5 py-5 text-sm leading-relaxed"><code
							class={`language-${data.paste.language}`}>{pasteContent}</code
						></pre>
				{/if}
			</div>
		</section>

		<div class="flex justify-end">
			<a
				href={resolve(rootPath)}
				class="inline-flex items-center border border-line bg-canvas px-4 py-2 font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:border-primary hover:bg-primary hover:text-ink"
			>
				{i18n.m.view.createOwn}
			</a>
		</div>
	{/if}
</main>
