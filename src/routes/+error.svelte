<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	import SadMascot from '#lib/components/SadMascot.svelte';
	import { i18n } from '#lib/i18n.svelte.js';

	const isNotFound = $derived(page.status === 404);
	const title = $derived(
		isNotFound ? i18n.m.errorPage.notFoundTitle : i18n.m.errorPage.genericTitle
	);
	const description = $derived(
		isNotFound ? i18n.m.errorPage.notFoundDescription : i18n.m.errorPage.genericDescription
	);
</script>

<svelte:head>
	<title>{title} - whisperbin</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl grow flex-col justify-center px-6 py-16">
	<section
		class="frame flex flex-col items-center gap-6 border border-line bg-surface px-6 py-10 text-center sm:flex-row sm:items-center sm:gap-10 sm:px-10 sm:py-12 sm:text-left"
	>
		<SadMascot />

		<div class="flex flex-col items-center gap-4 sm:items-start">
			{#if !isNotFound}
				<p class="font-mono text-xs text-muted">// {page.status}</p>
			{/if}
			<div class="flex flex-col gap-2">
				<h1 class="text-2xl sm:text-3xl">{title}</h1>
				<p class="max-w-md text-sm leading-relaxed text-secondary">{description}</p>
			</div>

			<a
				href={resolve('/')}
				class="mt-2 inline-flex items-center justify-center bg-accent px-5 py-2.5 font-display text-xs font-bold tracking-wider text-ink uppercase transition-colors cut hover:bg-primary hover:text-ink"
			>
				{i18n.m.errorPage.cta}
			</a>
		</div>
	</section>
</main>
