<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Impressum - whisperbin</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-20">
	<a
		href={resolve('/')}
		class="text-xs font-medium tracking-wide text-muted uppercase transition-colors hover:text-secondary"
	>
		← Zurück
	</a>

	<header class="flex flex-col gap-2">
		<h1 class="text-2xl">Impressum</h1>
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
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">Haftungsausschluss</h2>
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
</main>
