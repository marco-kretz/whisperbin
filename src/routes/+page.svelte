<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { resolve } from '$app/paths';

	import { encryptPayload, generatePassword } from '#lib/crypto.js';
	import type { ErrorKey } from '#lib/i18n.js';
	import { errorText, i18n } from '#lib/i18n.svelte.js';
	import { EXPIRATION_OPTIONS, LANGUAGE_OPTIONS } from '#lib/paste-options.js';

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
		error?: ErrorKey;
		max?: number;
		values?: FormValues;
	} | null;

	type PageProps = {
		data: { origin: string };
		form: ActionForm;
	};

	// Icon paths from Lucide (ISC license), 24x24 stroke icons, in the order of the feature texts
	const FEATURE_ICONS = [
		[
			'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
			'M7 11V7a5 5 0 0 1 10 0v4'
		],
		[
			'm15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4',
			'm21 2-9.6 9.6',
			'M2 15.5a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0'
		],
		['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 6v6l4 2'],
		[
			'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'
		]
	];

	const MAX_TITLE_LENGTH = 120;
	const MAX_CONTENT_LENGTH = 20000;
	const MAX_PASSWORD_LENGTH = 200;
	const MIN_GENERATED_LENGTH = 8;
	const MAX_GENERATED_LENGTH = 128;
	const GENERATOR_SETTINGS_KEY = 'whisperbin:password-generator';

	let { data, form }: PageProps = $props();

	const values = $derived(form?.values ?? {});
	let selectedExpiry = $state('24h');
	let selectedLanguage = $state('plaintext');
	let onetimeEnabled = $state(false);
	let titleValue = $state('');
	let contentValue = $state('');
	let encryptionKey = $state<string | null>(null);
	let clientError = $state<{ key: ErrorKey; max?: number } | null>(null);
	let encrypting = $state(false);
	let hydrated = $state(false);

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
		i18n.m.expiry[selectedExpiry as keyof typeof i18n.m.expiry] ?? selectedExpiry
	);
	const shareUrl = $derived(
		form?.id && encryptionKey
			? `${data.origin}${resolve('/[id]', { id: form.id })}#key=${encryptionKey}`
			: null
	);
	let copied = $state(false);

	let generatedLength = $state(24);
	let generatedWithSymbols = $state(true);
	let generatedPassword = $state('');
	let generatedCopied = $state(false);
	let contentElement = $state<HTMLTextAreaElement>();

	const clampGeneratedLength = (value: number) =>
		Math.min(MAX_GENERATED_LENGTH, Math.max(MIN_GENERATED_LENGTH, Math.round(value) || 0));

	onMount(() => {
		hydrated = true;
		try {
			const stored = JSON.parse(localStorage.getItem(GENERATOR_SETTINGS_KEY) ?? 'null');
			if (typeof stored?.length === 'number') generatedLength = clampGeneratedLength(stored.length);
			if (typeof stored?.withSymbols === 'boolean') generatedWithSymbols = stored.withSymbols;
		} catch {
			// Storage unavailable or corrupt: keep defaults.
		}
	});

	const regeneratePassword = () => {
		generatedLength = clampGeneratedLength(generatedLength);
		generatedPassword = generatePassword(generatedLength, generatedWithSymbols);
		try {
			localStorage.setItem(
				GENERATOR_SETTINGS_KEY,
				JSON.stringify({ length: generatedLength, withSymbols: generatedWithSymbols })
			);
		} catch {
			// Storage unavailable (e.g. private mode): settings just won't persist.
		}
	};

	const insertGeneratedPassword = () => {
		if (!generatedPassword || !contentElement) return;
		const { selectionStart, selectionEnd } = contentElement;
		contentValue =
			contentValue.slice(0, selectionStart) + generatedPassword + contentValue.slice(selectionEnd);
		const cursor = selectionStart + generatedPassword.length;
		requestAnimationFrame(() => {
			contentElement?.focus();
			contentElement?.setSelectionRange(cursor, cursor);
		});
	};

	const copyGeneratedPassword = async () => {
		if (!generatedPassword) return;
		await navigator.clipboard.writeText(generatedPassword);
		generatedCopied = true;
		setTimeout(() => (generatedCopied = false), 1500);
	};

	const encryptSubmit: SubmitFunction = async ({ formData, cancel }) => {
		clientError = null;
		encryptionKey = null;

		const trimmedTitle = titleValue.trim();
		const trimmedContent = contentValue.trim();

		if (!trimmedContent) {
			clientError = { key: 'contentRequired' };
			cancel();
			return;
		}

		if (trimmedContent.length > MAX_CONTENT_LENGTH) {
			clientError = { key: 'contentTooLong', max: MAX_CONTENT_LENGTH };
			cancel();
			return;
		}

		if (trimmedTitle.length > MAX_TITLE_LENGTH) {
			clientError = { key: 'titleTooLong', max: MAX_TITLE_LENGTH };
			cancel();
			return;
		}

		const password = formData.get('password');
		if (typeof password === 'string' && password.length > MAX_PASSWORD_LENGTH) {
			clientError = { key: 'passwordTooLong', max: MAX_PASSWORD_LENGTH };
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
			clientError = { key: 'encryptionFailed' };
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

	const revealShareUrl = (node: HTMLElement) => {
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
	};
</script>

<svelte:head>
	<title>{i18n.m.create.pageTitle}</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl grow flex-col gap-6 px-6 pt-3 pb-6">
	<!-- Header -->
	<header class="flex flex-col gap-3">
		<h1 class="text-4xl sm:text-5xl">{i18n.m.create.heading}</h1>
		<ul class="mt-3 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
			{#each i18n.m.create.features as feature, index (index)}
				<li class="flex items-start gap-3">
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-surface text-accent"
					>
						<svg
							class="h-4.5 w-4.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							{#each FEATURE_ICONS[index] as d (d)}
								<path {d} />
							{/each}
						</svg>
					</span>
					<span class="flex flex-col gap-0.5">
						<span class="text-sm font-medium text-primary">{feature.title}</span>
						<span class="text-xs leading-relaxed text-muted">{feature.text}</span>
					</span>
				</li>
			{/each}
		</ul>
	</header>

	<!-- Errors -->
	<noscript>
		<div class="border border-line bg-canvas px-4 py-3 text-sm text-secondary" role="alert">
			{i18n.m.create.noscript}
		</div>
	</noscript>

	{#if clientError}
		<div
			class="border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
			role="alert"
		>
			{errorText(clientError.key, clientError.max)}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="border-l-2 border-l-danger bg-danger-dim px-4 py-3 text-sm text-primary"
			role="alert"
		>
			{errorText(form.error, form.max)}
		</div>
	{/if}

	<!-- Form -->
	<div class="flex grow gap-0">
		<form
			method="POST"
			use:encryptEnhance
			class="frame flex grow flex-col gap-4 border border-line bg-surface p-6 sm:px-8"
		>
			<div class="flex flex-col gap-2">
				<label
					class="font-display text-xs font-semibold tracking-wider text-secondary uppercase"
					for="title"
				>
					{i18n.m.create.title}
					<span class="font-normal lowercase">{i18n.m.create.optional}</span>
				</label>
				<input
					id="title"
					placeholder={i18n.m.create.titlePlaceholder}
					maxlength={MAX_TITLE_LENGTH}
					class="border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
					bind:value={titleValue}
				/>
			</div>

			<div class="flex grow flex-col gap-2">
				<label
					class="font-display text-xs font-semibold tracking-wider text-secondary uppercase"
					for="content"
				>
					{i18n.m.create.content}
				</label>
				<textarea
					id="content"
					rows="6"
					required
					maxlength={MAX_CONTENT_LENGTH}
					placeholder={i18n.m.create.contentPlaceholder}
					class="grow resize-y border border-line bg-canvas px-3 py-2 font-mono text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
					bind:value={contentValue}
					bind:this={contentElement}></textarea>
			</div>

			<details class="group border border-line bg-canvas">
				<summary
					class="cursor-pointer px-4 py-3 font-display text-xs font-semibold tracking-wider text-secondary uppercase select-none hover:text-primary"
				>
					{i18n.m.create.generator}
				</summary>
				<div class="flex flex-col gap-4 border-t border-line px-4 py-4">
					<div class="flex flex-wrap items-end gap-4">
						<div class="flex grow flex-col gap-2">
							<label class="text-xs text-secondary" for="generatedLength">
								{i18n.m.create.length}
							</label>
							<div class="flex items-center gap-3">
								<input
									type="range"
									min={MIN_GENERATED_LENGTH}
									max={MAX_GENERATED_LENGTH}
									bind:value={generatedLength}
									oninput={regeneratePassword}
									aria-label={i18n.m.create.lengthAria}
									class="grow cursor-pointer accent-accent"
								/>
								<input
									id="generatedLength"
									type="number"
									min={MIN_GENERATED_LENGTH}
									max={MAX_GENERATED_LENGTH}
									bind:value={generatedLength}
									onchange={regeneratePassword}
									class="w-20 border border-line bg-surface px-2 py-1 text-sm text-primary focus:border-accent focus:outline-none"
								/>
							</div>
						</div>
						<label class="flex cursor-pointer items-center gap-2 pb-1 text-sm text-primary">
							<input
								type="checkbox"
								bind:checked={generatedWithSymbols}
								onchange={regeneratePassword}
								class="h-4 w-4 cursor-pointer accent-accent"
							/>
							{i18n.m.create.symbols}
						</label>
					</div>

					{#if generatedPassword}
						<code
							class="block border border-line bg-surface px-3 py-2 font-mono text-sm break-all text-primary"
						>
							{generatedPassword}
						</code>
					{/if}

					<div class="flex flex-wrap gap-3">
						<button
							type="button"
							onclick={regeneratePassword}
							class="inline-flex cursor-pointer items-center border border-line bg-surface px-4 py-2 font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:border-primary hover:bg-primary hover:text-ink"
						>
							{generatedPassword ? i18n.m.create.regenerate : i18n.m.create.generate}
						</button>
						{#if generatedPassword}
							<button
								type="button"
								onclick={insertGeneratedPassword}
								class="inline-flex cursor-pointer items-center border border-line bg-surface px-4 py-2 font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:border-primary hover:bg-primary hover:text-ink"
							>
								{i18n.m.create.insert}
							</button>
							<button
								type="button"
								onclick={copyGeneratedPassword}
								class="inline-flex cursor-pointer items-center border border-line bg-surface px-4 py-2 font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:border-primary hover:bg-primary hover:text-ink"
							>
								{generatedCopied ? i18n.m.copied : i18n.m.copy}
							</button>
						{/if}
					</div>
				</div>
			</details>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div class="flex flex-col gap-2">
					<label
						class="font-display text-xs font-semibold tracking-wider text-secondary uppercase"
						for="expiresIn"
					>
						{i18n.m.create.expiresIn}
					</label>
					<select
						id="expiresIn"
						name="expiresIn"
						required
						bind:value={selectedExpiry}
						class="cursor-pointer border border-line bg-canvas px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
					>
						{#each EXPIRATION_OPTIONS as option (option.value)}
							<option value={option.value}>{i18n.m.expiry[option.value]}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<label
						class="font-display text-xs font-semibold tracking-wider text-secondary uppercase"
						for="language"
					>
						{i18n.m.create.format}
					</label>
					<select
						id="language"
						name="language"
						required
						bind:value={selectedLanguage}
						class="cursor-pointer border border-line bg-canvas px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
					>
						{#each LANGUAGE_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
					<label
						class="font-display text-xs font-semibold tracking-wider text-secondary uppercase"
						for="password"
					>
						{i18n.m.create.password}
						<span class="font-normal lowercase">{i18n.m.create.optional}</span>
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						maxlength={MAX_PASSWORD_LENGTH}
						placeholder={i18n.m.create.passwordPlaceholder}
						class="border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
					/>
				</div>
			</div>

			<label class="flex cursor-pointer items-start gap-3 border border-line bg-canvas px-4 py-3">
				<input
					class="mt-1 h-4 w-4 cursor-pointer border-line bg-canvas accent-accent focus:ring-0 focus:ring-offset-0"
					type="checkbox"
					name="onetime"
					bind:checked={onetimeEnabled}
				/>
				<span class="flex flex-col gap-1">
					<span class="text-sm font-medium text-primary">{i18n.m.create.onetime}</span>
					<span class="text-xs text-muted">
						{i18n.m.create.onetimeHint}
					</span>
				</span>
			</label>

			<button
				type="submit"
				disabled={!hydrated || encrypting}
				class="inline-flex cursor-pointer items-center justify-center gap-2 bg-accent px-5 py-3 font-display text-sm font-bold tracking-wider text-ink uppercase transition-colors cut hover:bg-primary hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
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
					{i18n.m.create.encrypting}
				{:else}
					{i18n.m.create.submit}
				{/if}
			</button>
		</form>
	</div>

	<!-- Share URL -->
	{#if shareUrl}
		<!-- Keyed so a second paste replays the reveal -->
		{#key shareUrl}
			<section class="flex scroll-mb-6 gap-0" {@attach revealShareUrl}>
				<div
					class="frame flex grow reveal flex-col gap-3 border border-amber/40 bg-surface p-6 [--frame-color:var(--color-amber)] sm:px-8 sm:py-8"
				>
					<div class="flex items-center justify-between gap-2">
						<span
							class="glitch font-display text-sm font-bold tracking-wider text-primary uppercase"
						>
							{i18n.m.create.linkReady}
						</span>
						<span class="border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-secondary">
							{selectedExpiryLabel}
						</span>
					</div>
					<code
						class="block border border-line bg-canvas px-3 py-2.5 font-mono text-sm break-all text-primary"
					>
						{shareUrl}
					</code>
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={copyShareUrl}
							class="inline-flex cursor-pointer items-center border border-line bg-canvas px-4 py-2 font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:border-primary hover:bg-primary hover:text-ink"
						>
							{copied ? i18n.m.copied : i18n.m.copy}
						</button>
					</div>
					<p class="text-xs leading-relaxed text-muted">
						{i18n.m.create.shareHint}
					</p>
				</div>
			</section>
		{/key}
	{/if}
</main>
