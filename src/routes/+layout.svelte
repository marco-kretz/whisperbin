<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<footer class="mt-auto border-t border-line px-6 py-8">
	<div
		class="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-4 text-xs text-muted"
	>
		<span>whisperbin</span>
		<div class="flex items-center gap-4">
			<a href={resolve('/impressum')} class="hover:text-secondary">Impressum</a>
			<a href={resolve('/privacy')} class="hover:text-secondary">Datenschutz</a>
		</div>
	</div>
</footer>
