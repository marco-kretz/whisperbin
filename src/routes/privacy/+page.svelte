<script lang="ts">
	import { resolve } from '$app/paths';

	import { i18n } from '#lib/i18n.svelte.js';
</script>

<svelte:head>
	<title>{i18n.locale === 'de' ? 'Datenschutz' : 'Privacy'} - whisperbin</title>
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
			<h1 class="text-3xl">Datenschutzerklärung</h1>
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
					verlässt niemals deinen Browser und wird nur über das URL-Fragment geteilt (welches nicht
					an den Server gesendet wird).
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
				<p>
					Diese Website verwendet keine Tracking-Cookies oder Analyse-Tools von Drittanbietern. Wenn
					du die Sprache umschaltest, wird deine Auswahl in einem technisch notwendigen Cookie
					(„locale“) für ein Jahr gespeichert.
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">6. Hosting</h2>
				<p>
					Diese Website wird bei netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe gehostet.
					Weitere Informationen:
					<a href="https://www.netcup.com/de/kontakt/datenschutzerklaerung" class="underline">
						www.netcup.com/de/kontakt/datenschutzerklaerung
					</a>.
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
				<p class="text-muted">Stand: November 2026</p>
			</div>
		</section>
	{:else}
		<header class="flex flex-col gap-2">
			<h1 class="text-3xl">Privacy policy</h1>
			<p class="text-sm text-secondary">Pursuant to the GDPR</p>
		</header>

		<section class="flex flex-col gap-8 text-sm leading-relaxed text-secondary">
			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">1. Controller</h2>
				<p>
					Marco Kretz<br />
					Disternicher Weg 1a<br />
					52391 Vettweiß<br />
					Germany<br />
					Email: hallo@marco-kretz.de
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">2. Overview</h2>
				<p>
					This website was built with privacy in mind. All message content is encrypted on the
					client before it is transmitted. The encryption key never leaves your browser and is only
					shared via the URL fragment (which is not sent to the server).
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">
					3. Data processed
				</h2>
				<div class="flex flex-col gap-4">
					<div>
						<strong class="text-primary">Server logs:</strong> When you visit, the server records:
						<ul class="mt-2 ml-4 list-disc">
							<li>IP address (anonymized after 7 days)</li>
							<li>Date and time of access</li>
							<li>Requested URL</li>
							<li>Browser type and version</li>
							<li>Operating system</li>
						</ul>
						<p class="mt-2">Legal basis: Art. 6(1)(f) GDPR.</p>
					</div>

					<div>
						<strong class="text-primary">Message content:</strong> When you create a message, we
						store:
						<ul class="mt-2 ml-4 list-disc">
							<li>Encrypted content (unreadable without the key)</li>
							<li>Expiration time</li>
							<li>Format setting</li>
							<li>Password hash (if password-protected)</li>
						</ul>
						<p class="mt-2">Legal basis: Art. 6(1)(b) GDPR.</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">4. Retention</h2>
				<p>
					Messages are deleted automatically once their configured expiration time has passed.
					One-time messages are deleted immediately after they are opened. Server logs are kept for
					at most 7 days.
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">5. Cookies</h2>
				<p>
					This website does not use tracking cookies or third-party analytics tools. If you switch
					the language, your choice is stored in a strictly necessary cookie ("locale") for one
					year.
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">6. Hosting</h2>
				<p>
					This website is hosted by netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe, Germany.
					More information:
					<a href="https://www.netcup.com/de/kontakt/datenschutzerklaerung" class="underline">
						www.netcup.com/de/kontakt/datenschutzerklaerung
					</a>.
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">7. Your rights</h2>
				<div class="flex flex-col gap-2 text-secondary">
					<p>Under the GDPR you have the following rights:</p>
					<ul class="ml-4 list-disc">
						<li>Access (Art. 15 GDPR)</li>
						<li>Rectification (Art. 16 GDPR)</li>
						<li>Erasure (Art. 17 GDPR)</li>
						<li>Restriction of processing (Art. 18 GDPR)</li>
						<li>Data portability (Art. 20 GDPR)</li>
						<li>Objection (Art. 21 GDPR)</li>
					</ul>
					<p class="mt-2">To exercise these rights, contact me at the address above.</p>
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="text-xs font-semibold tracking-wide text-primary uppercase">8. Changes</h2>
				<p>
					We may update this privacy policy from time to time. The current version is always
					available on this page.
				</p>
				<p class="text-muted">Last updated: November 2026</p>
			</div>
		</section>
	{/if}
</main>
