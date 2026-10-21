<script lang="ts">
	import '@fontsource/chakra-petch/500.css';
	import '@fontsource/chakra-petch/600.css';
	import '@fontsource/chakra-petch/700.css';
	import './layout.css';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<footer class="mt-auto border-t border-line py-8">
	<div
		class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 font-mono text-xs text-muted"
	>
		<span>whisperbin</span>
		<div class="flex items-center gap-4">
			<a href={resolve('impressum')} class="hover:text-secondary">Impressum</a>
			<a href={resolve('privacy')} class="hover:text-secondary">Datenschutz</a>
		</div>
	</div>
</footer>
