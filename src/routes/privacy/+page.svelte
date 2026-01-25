<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Datenschutz - whiserpbin</title>
</svelte:head>

<main class="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
	<a
		href={resolve('/')}
		class="text-xs tracking-[0.25em] text-emerald-300/70 uppercase hover:text-emerald-200"
	>
		&larr; Zurück
	</a>

	<header class="flex flex-col gap-2">
		<h1 class="text-3xl font-semibold text-emerald-100">Datenschutzerklärung</h1>
		<p class="text-sm text-emerald-200/60">Gemäß DSGVO</p>
	</header>

	<section class="flex flex-col gap-8 text-sm text-emerald-100/80">
		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				1. Verantwortlicher
			</h2>
			<p>
				Marco Kretz<br />
				Disternicher Weg 1a<br />
				52391 Vettweiß<br />
				Deutschland<br />
				E-Mail: hallo@marco-kretz.de
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				2. Überblick zur Datenverarbeitung
			</h2>
			<p class="text-emerald-100/70">
				Diese Website wurde mit Datenschutz im Blick entwickelt. Alle Paste-Inhalte werden
				clientseitig verschlüsselt, bevor sie übertragen werden. Der Verschlüsselungsschlüssel
				verlässt niemals deinen Browser und wird nur über das URL-Fragment geteilt (welches nicht an
				den Server gesendet wird).
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				3. Welche Daten wir verarbeiten
			</h2>
			<div class="flex flex-col gap-4 text-emerald-100/70">
				<div>
					<strong class="text-emerald-100">Server-Logs:</strong> Beim Besuch dieser Website erfasst
					unser Server automatisch:
					<ul class="mt-2 ml-4 list-disc">
						<li>IP-Adresse (nach 7 Tagen anonymisiert)</li>
						<li>Datum und Uhrzeit des Zugriffs</li>
						<li>Aufgerufene URL</li>
						<li>Browsertyp und -version</li>
						<li>Betriebssystem</li>
					</ul>
					<p class="mt-2">
						Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
						Gewährleistung der Sicherheit und Stabilität der Website).
					</p>
				</div>

				<div>
					<strong class="text-emerald-100">Paste-Inhalte:</strong> Beim Erstellen eines Pastes
					speichern wir:
					<ul class="mt-2 ml-4 list-disc">
						<li>Verschlüsselten Inhalt (ohne Schlüssel nicht lesbar)</li>
						<li>Ablaufzeit</li>
						<li>Sprach-/Syntax-Einstellung</li>
						<li>Passwort-Hash (falls passwortgeschützt)</li>
					</ul>
					<p class="mt-2">
						Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung / Bereitstellung des
						Dienstes).
					</p>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				4. Speicherdauer
			</h2>
			<p class="text-emerald-100/70">
				Pastes werden automatisch nach ihrer konfigurierten Ablaufzeit gelöscht (zwischen 1 Stunde
				und 30 Tagen). Einmalige Pastes werden sofort nach dem Anzeigen gelöscht. Server-Logs werden
				maximal 7 Tage aufbewahrt.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				5. Cookies
			</h2>
			<p class="text-emerald-100/70">
				Diese Website verwendet keine Tracking-Cookies oder Analyse-Tools von Drittanbietern. Es
				werden nur essenzielle technische Cookies für die Grundfunktionalität verwendet.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				6. Hosting
			</h2>
			<p class="text-emerald-100/70">
				Diese Website wird bei netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe, Deutschland
				gehostet. Der Hoster kann Daten in unserem Auftrag verarbeiten. Weitere Informationen
				findest du in der Datenschutzerklärung von netcup unter
				<a href="https://www.netcup.com/de/kontakt/datenschutzerklaerung" class="underline">
					www.netcup.com/de/kontakt/datenschutzerklaerung</a
				>.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				7. Deine Rechte
			</h2>
			<div class="flex flex-col gap-2 text-emerald-100/70">
				<p>Nach der DSGVO hast du folgende Rechte:</p>
				<ul class="ml-4 list-disc">
					<li>Auskunft über deine personenbezogenen Daten (Art. 15 DSGVO)</li>
					<li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
					<li>Löschung deiner Daten (Art. 17 DSGVO)</li>
					<li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
					<li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
					<li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
				</ul>
				<p class="mt-2">
					Um diese Rechte auszuüben, kontaktiere mich unter der oben genannten Adresse. Du hast
					außerdem das Recht, dich bei einer Aufsichtsbehörde zu beschweren.
				</p>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-xs font-semibold tracking-[0.25em] text-emerald-200/70 uppercase">
				8. Änderungen dieser Erklärung
			</h2>
			<p class="text-emerald-100/70">
				Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. Die aktuelle Version
				ist immer auf dieser Seite verfügbar.
			</p>
			<p class="text-emerald-200/50">Stand: Januar 2025</p>
		</div>
	</section>
</main>
