<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Datenschutz - whisperbin</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-20">
	<a
		href={resolve('/')}
		class="text-xs font-medium tracking-wide text-muted uppercase transition-colors hover:text-secondary"
	>
		← Zurück
	</a>

	<header class="flex flex-col gap-2">
		<h1 class="text-2xl">Datenschutzerklärung</h1>
		<p class="text-sm text-secondary">Gemäß DSGVO</p>
	</header>

	<section class="flex flex-col gap-8 text-sm leading-relaxed text-secondary">
		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">
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

		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">2. Überblick</h2>
			<p>
				Diese Website wurde mit Datenschutz im Blick entwickelt. Alle Nachrichteninhalte werden
				clientseitig verschlüsselt, bevor sie übertragen werden. Der Verschlüsselungsschlüssel
				verlässt niemals deinen Browser und wird nur über das URL-Fragment geteilt (welches nicht an
				den Server gesendet wird).
			</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">
				3. Verarbeitete Daten
			</h2>
			<div class="flex flex-col gap-4">
				<div>
					<strong class="text-primary">Server-Logs:</strong> Beim Besuch erfasst der Server:
					<ul class="mt-2 ml-4 list-disc">
						<li>IP-Adresse (nach 7 Tagen anonymisiert)</li>
						<li>Datum und Uhrzeit des Zugriffs</li>
						<li>Aufgerufene URL</li>
						<li>Browsertyp und -version</li>
						<li>Betriebssystem</li>
					</ul>
					<p class="mt-2">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</p>
				</div>

				<div>
					<strong class="text-primary">Nachrichteninhalte:</strong> Beim Erstellen speichern wir:
					<ul class="mt-2 ml-4 list-disc">
						<li>Verschlüsselten Inhalt (ohne Schlüssel nicht lesbar)</li>
						<li>Ablaufzeit</li>
						<li>Format-Einstellung</li>
						<li>Passwort-Hash (falls passwortgeschützt)</li>
					</ul>
					<p class="mt-2">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">4. Speicherdauer</h2>
			<p>
				Nachrichten werden automatisch nach ihrer konfigurierten Ablaufzeit gelöscht. Einmalige
				Nachrichten werden sofort nach dem Öffnen gelöscht. Server-Logs werden maximal 7 Tage
				aufbewahrt.
			</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">5. Cookies</h2>
			<p>Diese Website verwendet keine Tracking-Cookies oder Analyse-Tools von Drittanbietern.</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">6. Hosting</h2>
			<p>
				Diese Website wird bei netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe gehostet.
				Weitere Informationen:
				<a href="https://www.netcup.com/de/kontakt/datenschutzerklaerung" class="underline">
					www.netcup.com/de/kontakt/datenschutzerklaerung</a
				>.
			</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">7. Deine Rechte</h2>
			<div class="flex flex-col gap-2 text-secondary">
				<p>Nach der DSGVO hast du folgende Rechte:</p>
				<ul class="ml-4 list-disc">
					<li>Auskunft (Art. 15 DSGVO)</li>
					<li>Berichtigung (Art. 16 DSGVO)</li>
					<li>Löschung (Art. 17 DSGVO)</li>
					<li>Einschränkung (Art. 18 DSGVO)</li>
					<li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
					<li>Widerspruch (Art. 21 DSGVO)</li>
				</ul>
				<p class="mt-2">
					Um diese Rechte auszuüben, kontaktiere mich unter der oben genannten Adresse.
				</p>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">8. Änderungen</h2>
			<p>
				Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. Die aktuelle Version
				ist immer auf dieser Seite verfügbar.
			</p>
			<p class="text-muted">Stand: Januar 2025</p>
		</div>
	</section>
</main>
