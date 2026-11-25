<svg
	class="mascot h-36 w-36 shrink-0 sm:h-44 sm:w-44"
	viewBox="0 0 180 180"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- Ground shadow -->
	<ellipse class="mascot-shadow" cx="90" cy="158" rx="44" ry="6.5" fill="rgba(0, 0, 0, 0.42)" />

	<!-- Floating wisps (vanished secret) -->
	<g class="mascot-wisp">
		<path
			d="M123 48 C123 40, 132 39, 132 31 C132 25, 126 23, 126 18"
			stroke="var(--color-muted)"
			stroke-width="2.2"
			stroke-linecap="round"
			opacity="0.65"
		/>
		<path
			d="M137 54 C140 48, 146 49, 147 42"
			stroke="var(--color-muted)"
			stroke-width="1.8"
			stroke-linecap="round"
			opacity="0.45"
		/>
		<path d="M42 46 L44.5 41 L47 46 L44.5 51 Z" fill="var(--color-amber)" opacity="0.65" />
		<circle cx="144" cy="27" r="2" fill="var(--color-hot)" opacity="0.7" />
	</g>

	<!-- Floating padlock mascot -->
	<g class="mascot-body">
		<!-- Open, slightly askew shackle -->
		<g transform="rotate(-7 64 74)">
			<path
				d="M64 76 V49 C64 34 75 24 90 24 C105 24 116 34 116 49 V58"
				stroke="var(--color-secondary)"
				stroke-width="10"
				stroke-linecap="round"
			/>
			<path
				d="M64 74 V49 C64 36.5 73.5 27.5 87 26.2"
				stroke="var(--color-primary)"
				stroke-width="2.2"
				stroke-linecap="round"
				opacity="0.45"
			/>
		</g>

		<!-- Chamfered lock body (echoes whisperbin's .cut silhouette & favicon) -->
		<path
			d="M56 74 H136 V134 L124 146 H44 V86 Z"
			fill="var(--color-canvas)"
			stroke="var(--color-line-strong)"
			stroke-width="2.5"
			stroke-linejoin="miter"
		/>

		<!-- Subtle inner plate -->
		<path
			d="M59 80 H130 V131 L121 140 H50 V89 Z"
			fill="var(--color-surface)"
			stroke="var(--color-line)"
			stroke-width="1"
		/>

		<!-- Tiny accent corner ticks -->
		<path
			d="M56 74 H68 M44 86 V96"
			stroke="var(--color-accent)"
			stroke-width="2.5"
			stroke-linecap="square"
		/>
		<path
			d="M124 146 H112 M136 134 V124"
			stroke="var(--color-accent)"
			stroke-width="2.5"
			stroke-linecap="square"
		/>

		<!-- Worried eyebrows -->
		<path
			d="M63 100 L75 95"
			stroke="var(--color-primary)"
			stroke-width="2.4"
			stroke-linecap="round"
		/>
		<path
			d="M117 100 L105 95"
			stroke="var(--color-primary)"
			stroke-width="2.4"
			stroke-linecap="round"
		/>

		<!-- Sad glossy eyes -->
		<g>
			<circle cx="72" cy="109" r="6.2" fill="var(--color-primary)" />
			<circle cx="72" cy="110.5" r="3.2" fill="var(--color-canvas)" />
			<circle cx="70" cy="107.2" r="1.4" fill="#ffffff" />

			<circle cx="108" cy="109" r="6.2" fill="var(--color-primary)" />
			<circle cx="108" cy="110.5" r="3.2" fill="var(--color-canvas)" />
			<circle cx="106" cy="107.2" r="1.4" fill="#ffffff" />
		</g>

		<!-- Soft blush -->
		<ellipse cx="61" cy="118" rx="5.2" ry="2.6" fill="var(--color-accent)" opacity="0.28" />
		<ellipse cx="119" cy="118" rx="5.2" ry="2.6" fill="var(--color-accent)" opacity="0.28" />

		<!-- Small sad mouth -->
		<path
			d="M81 126 Q90 119 99 126"
			stroke="var(--color-primary)"
			stroke-width="2.6"
			stroke-linecap="round"
		/>

		<!-- Teardrop -->
		<path
			class="mascot-tear"
			d="M115 116 C115 116 119.5 121.5 119.5 124.5 C119.5 127 117.5 129 115 129 C112.5 129 110.5 127 110.5 124.5 C110.5 121.5 115 116 115 116 Z"
			fill="var(--color-success)"
		/>
	</g>
</svg>

<style>
	.mascot-body {
		animation: mascot-float 3.6s ease-in-out infinite;
	}

	.mascot-shadow {
		transform-box: fill-box;
		transform-origin: center;
		animation: mascot-shadow 3.6s ease-in-out infinite;
	}

	.mascot-wisp {
		animation: mascot-wisp 4.2s ease-in-out infinite;
	}

	.mascot-tear {
		animation: mascot-tear 2.8s ease-in infinite;
	}

	@keyframes mascot-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	@keyframes mascot-shadow {
		0%,
		100% {
			transform: scaleX(1);
			opacity: 0.42;
		}
		50% {
			transform: scaleX(0.9);
			opacity: 0.28;
		}
	}

	@keyframes mascot-wisp {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.9;
		}
		50% {
			transform: translateY(-5px);
			opacity: 0.45;
		}
	}

	@keyframes mascot-tear {
		0% {
			transform: translateY(-2px);
			opacity: 0;
		}
		20% {
			opacity: 0.95;
		}
		80% {
			transform: translateY(6px);
			opacity: 0.9;
		}
		100% {
			transform: translateY(10px);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mascot-body,
		.mascot-shadow,
		.mascot-wisp,
		.mascot-tear {
			animation: none;
		}
	}
</style>
