<script lang="ts">
</script>

<svelte:head>
	<title>Impressum - whiserpbin</title>
</svelte:head>

<main class="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
	<a
		href="/"
		class="text-xs tracking-[0.25em] text-emerald-300/70 uppercase hover:text-emerald-200"
	>
		&larr; Zurück
	</a>

	<header class="flex flex-col gap-2">
		<h1 class="text-3xl font-semibold text-emerald-100">Impressum</h1>
		<p class="text-sm text-emerald-200/60">Angaben gemäß § 5 TMG</p>
	</header>

	<section class="flex flex-col gap-6 text-sm text-emerald-100/80">
		<div class="flex flex-col gap-2">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				Verantwortlich für den Inhalt
			</h2>
			<p>
				Marco Kretz<br />
				Disternicher Weg 1a<br />
				52391 Vettweiß<br />
				Deutschland
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">Kontakt</h2>
			<p>
				E-Mail: hallo@marco-kretz.de
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				Haftungsausschluss
			</h2>
			<div class="flex flex-col gap-3 text-emerald-100/70">
				<p>
					<strong class="text-emerald-100">Haftung für Inhalte:</strong> Die Inhalte dieser Website
					wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität
					der Inhalte kann ich jedoch keine Gewähr übernehmen.
				</p>
				<p>
					<strong class="text-emerald-100">Haftung für Links:</strong> Diese Website enthält Links zu
					externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für
					diese fremden Inhalte auch keine Gewähr übernehmen.
				</p>
			</div>
		</div>
	</section>
</main>
