<script lang="ts">
	import { resolve } from '$app/paths';
	import { EXPIRATION_OPTIONS, LANGUAGE_OPTIONS } from '$lib/paste-options';

	type FormValues = {
		title?: string | null;
		content?: string | null;
		expiresIn?: string | null;
		language?: string | null;
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

	let { data, form }: PageProps = $props();

	const values = $derived(form?.values ?? {});
	const selectedExpiry = $derived(values.expiresIn ?? '24h');
	const selectedLanguage = $derived(values.language ?? 'plaintext');
	const sharePath = $derived(form?.id ? `/${form.id}` : null);
	const shareUrl = $derived(sharePath ? `${data.origin}${resolve(sharePath as '/')}` : null);
	let copied = $state(false);

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
	<title>Paste It</title>
</svelte:head>

<main class="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
	<header class="flex flex-col gap-4">
		<p class="text-xs tracking-[0.35em] text-emerald-300/70 uppercase">Paste It Terminal</p>
		<h1 class="text-4xl font-semibold text-emerald-100">Paste It</h1>
		<p class="max-w-xl text-sm text-emerald-100/70">
			Drop a snippet, set the expiry timer, and ship a read-only link with a minimal footprint.
		</p>
		<div class="flex flex-wrap gap-3 text-xs text-emerald-200/70">
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				TTL {selectedExpiry}
			</span>
			<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
				LANG {selectedLanguage}
			</span>
		</div>
	</header>

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
		class="flex flex-col gap-6 rounded-2xl border border-emerald-500/20 bg-black/40 p-6 shadow-[0_0_0_1px_rgba(98,243,174,0.12),0_30px_80px_rgba(0,0,0,0.6)]"
	>
		<div
			class="flex items-center gap-3 border-b border-emerald-500/15 pb-4 text-xs text-emerald-200/70"
		>
			<span class="h-2 w-2 rounded-full bg-rose-500/80"></span>
			<span class="h-2 w-2 rounded-full bg-amber-400/80"></span>
			<span class="h-2 w-2 rounded-full bg-emerald-400/80"></span>
			<span class="ml-2 tracking-[0.3em] uppercase">New Paste</span>
			<span class="ml-auto text-emerald-300/60">session online</span>
		</div>

		<div class="flex flex-col gap-2">
			<label
				class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
				for="title"
			>
				Title (optional)
			</label>
			<input
				id="title"
				name="title"
				placeholder="Untitled snippet"
				class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				value={values.title ?? ''}
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label
				class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
				for="content"
			>
				Paste
			</label>
			<textarea
				id="content"
				name="content"
				rows="12"
				required
				placeholder="Paste your content here..."
				class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				>{values.content ?? ''}</textarea
			>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<label
					class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase"
					for="expiresIn"
				>
					Expires in
				</label>
				<select
					id="expiresIn"
					name="expiresIn"
					required
					class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				>
					{#each EXPIRATION_OPTIONS as option (option.value)}
						<option value={option.value} selected={option.value === selectedExpiry}>
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
					File type
				</label>
				<select
					id="language"
					name="language"
					required
					class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
				>
					{#each LANGUAGE_OPTIONS as option (option.value)}
						<option value={option.value} selected={option.value === selectedLanguage}>
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
				Password (optional)
			</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="new-password"
				placeholder="Protect this paste"
				class="rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/30 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
			/>
			<p class="text-xs text-emerald-200/50">Leave blank for public access.</p>
		</div>

		<button
			type="submit"
			class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
		>
			Create paste
		</button>
	</form>

	{#if shareUrl}
		<section
			class="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 shadow-[0_0_40px_rgba(82,255,174,0.16)]"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 text-xs tracking-[0.2em] text-emerald-200/70 uppercase"
			>
				<span>Link ready</span>
				<span>TTL {selectedExpiry}</span>
			</div>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<a
					class="block text-sm break-all text-emerald-100"
					href={resolve((sharePath ?? '/') as '/')}
				>
					{shareUrl}
				</a>
				<button
					type="button"
					onclick={copyShareUrl}
					class="inline-flex cursor-pointer items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-950/40 px-3 py-1 text-xs tracking-[0.2em] text-emerald-200 uppercase transition hover:border-emerald-200 hover:text-emerald-100"
				>
					{copied ? 'Copied' : 'Copy'}
				</button>
				<span class="sr-only" aria-live="polite">
					{copied ? 'Link copied to clipboard.' : ''}
				</span>
			</div>

			<p class="mt-3 text-xs text-emerald-200/60">
				This paste is read-only and will self-destruct automatically.
			</p>
		</section>
	{/if}
</main>
