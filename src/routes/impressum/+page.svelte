<script lang="ts">
	import { resolve } from '$app/paths';

	import { i18n } from '#lib/i18n.svelte.js';
</script>

<svelte:head>
	<title>{i18n.locale === 'de' ? 'Impressum' : 'Legal notice'} - whisperbin</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-20">
	<a
		href={resolve('/')}
		class="w-fit font-display text-xs font-semibold tracking-wider text-secondary uppercase transition-colors hover:text-accent"
	>
		{i18n.m.back}
	</a>

	{#if i18n.locale === 'de'}
		<header class="flex flex-col gap-2">
			<h1 class="text-3xl">Impressum</h1>
			<p class="text-sm text-secondary">Angaben gemäß § 5 TMG</p>
		</header>

		<section class="flex flex-col gap-8 text-sm leading-relaxed text-secondary">
			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">Verantwortlich</h2>
				<p>
					Marco Kretz<br />
					Disternicher Weg 1a<br />
					52391 Vettweiß<br />
					Deutschland
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">Kontakt</h2>
				<p>E-Mail: hallo@marco-kretz.de</p>
			</div>

			<div class="flex flex-col gap-3">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">
					Haftungsausschluss
				</h2>
				<div class="flex flex-col gap-3 text-secondary">
					<p>
						<strong class="text-primary">Haftung für Inhalte:</strong> Die Inhalte dieser Website wurden
						mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
						kann ich jedoch keine Gewähr übernehmen.
					</p>
					<p>
						<strong class="text-primary">Haftung für Links:</strong> Diese Website enthält Links zu externen
						Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden
						Inhalte auch keine Gewähr übernehmen.
					</p>
				</div>
			</div>
		</section>
	{:else}
		<header class="flex flex-col gap-2">
			<h1 class="text-3xl">Legal notice</h1>
			<p class="text-sm text-secondary">Information pursuant to § 5 TMG</p>
		</header>

		<section class="flex flex-col gap-8 text-sm leading-relaxed text-secondary">
			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">Responsible</h2>
				<p>
					Marco Kretz<br />
					Disternicher Weg 1a<br />
					52391 Vettweiß<br />
					Germany
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">Contact</h2>
				<p>Email: hallo@marco-kretz.de</p>
			</div>

			<div class="flex flex-col gap-3">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">Disclaimer</h2>
				<div class="flex flex-col gap-3 text-secondary">
					<p>
						<strong class="text-primary">Liability for content:</strong> The content of this website was
						created with the utmost care. However, I cannot guarantee that it is accurate, complete or
						up to date.
					</p>
					<p>
						<strong class="text-primary">Liability for links:</strong> This website contains links to
						external third-party websites whose content I have no influence over. I therefore cannot accept
						any liability for that content.
					</p>
				</div>
			</div>
		</section>
	{/if}
</main>
