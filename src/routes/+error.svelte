<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	import { i18n } from '#lib/i18n.svelte.js';

	const message = $derived(page.status === 404 ? i18n.m.notFound : i18n.m.genericError);
</script>

<svelte:head>
	<title>{message} - whisperbin</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-20">
	<a
		href={resolve('/')}
		class="w-fit font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:text-accent"
	>
		{i18n.m.view.newMessage}
	</a>
	<header class="flex flex-col gap-2">
		<p class="font-mono text-xs text-muted">{page.status}</p>
		<h1 class="text-3xl">{message}</h1>
	</header>
</main>
