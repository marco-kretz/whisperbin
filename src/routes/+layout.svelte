<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<footer class="mt-auto border-t border-emerald-500/10 py-6 text-center text-xs text-emerald-200/40">
	<div class="flex flex-wrap items-center justify-center gap-4">
		<a href="/impressum" class="hover:text-emerald-200/70">Impressum</a>
		<span class="text-emerald-500/30">|</span>
		<a href="/privacy" class="hover:text-emerald-200/70">Datenschutz</a>
	</div>
</footer>
