<script lang="ts">
	import { page } from '$app/state';
	import { pageOrder, pageKeyFromHref } from '$lib/pages';

	const BOW_TIGHT = 0.52;
	const BOW_WIDE = 1.18;
	const EDGE = 0.985; // just inside the glass rim
	const NUDGE = 5; // flush against the screen edge
	const TRACK_WIDTH = 16; // 1rem
	const SAMPLES = 96;

	const seg = 100 / (pageOrder.length + 1);

	let vw = $state(0);
	let vh = $state(0);

	const pageIndex = $derived.by(() => {
		const index = pageOrder.indexOf(pageKeyFromHref(page.url.pathname) || 'home');
		return index === -1 ? 0 : index;
	});

	const track = $derived.by(() => {
		if (!vw || !vh) return null;

		const rx = EDGE * BOW_TIGHT * vw;
		const ry = EDGE * BOW_WIDE * vh;

		const points: [number, number][] = [];
		for (let i = 0; i <= SAMPLES; i++) {
			const y = (vh * i) / SAMPLES;
			points.push([vw / 2 + rx * Math.sqrt(1 - ((y - vh / 2) / ry) ** 2) + NUDGE, y]);
		}

		const center: [number, number][] = points.map(([x, y], i) => {
			const [xa, ya] = points[Math.max(0, i - 1)];
			const [xb, yb] = points[Math.min(SAMPLES, i + 1)];
			const run = Math.hypot(xb - xa, yb - ya) || 1;
			return [
				x + (TRACK_WIDTH / 2) * (-(yb - ya) / run),
				y + (TRACK_WIDTH / 2) * ((xb - xa) / run)
			];
		});

		let length = 0;
		for (let i = 1; i < center.length; i++) {
			length += Math.hypot(center[i][0] - center[i - 1][0], center[i][1] - center[i - 1][1]);
		}

		return {
			d: center.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' '),
			px: 100 / length
		};
	});
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />

{#if track}
	<svg class="scroll-indicator" aria-hidden="true">
		<defs>
			<pattern
				id="scroll-track-hatch"
				width="3"
				height="3"
				patternUnits="userSpaceOnUse"
				patternTransform="rotate(45)"
			>
				<rect width="1" height="3" fill="rgba(0, 0, 0, 0.05)" />
			</pattern>
			<pattern id="scroll-thumb-grooves" width="4" height="3" patternUnits="userSpaceOnUse">
				<rect width="4" height="3" fill="#c8c8c8" />
				<rect width="4" height="1" fill="#8f8f8f" />
			</pattern>
		</defs>

		<path class="track-border" d={track.d} />
		<path class="track-highlight" d={track.d} />
		<path class="track-fill" d={track.d} />
		<path class="track-hatch" d={track.d} />

		<path
			class="thumb thumb-border"
			d={track.d}
			pathLength="100"
			stroke-dasharray="{seg - 16 * track.px} {100 - seg + 16 * track.px}"
			stroke-dashoffset={-(seg * pageIndex + 8 * track.px)}
		/>
		<path
			class="thumb thumb-fill"
			d={track.d}
			pathLength="100"
			stroke-dasharray="{seg - 16 * track.px} {100 - seg + 16 * track.px}"
			stroke-dashoffset={-(seg * pageIndex + 8 * track.px)}
		/>
		<path
			class="thumb thumb-grooves"
			d={track.d}
			pathLength="100"
			stroke-dasharray="{seg - 24 * track.px} {100 - seg + 24 * track.px}"
			stroke-dashoffset={-(seg * pageIndex + 12 * track.px)}
		/>
	</svg>
{/if}

<style lang="scss">
	.scroll-indicator {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1000;

		path {
			fill: none;
			stroke-linejoin: round;
		}

		.track {
			&-border {
				stroke: #808080;
				stroke-width: 24;
			}

			&-highlight {
				stroke: #fff;
				stroke-width: 22;
			}

			&-fill {
				stroke: #d9d9d9;
				stroke-width: 20;
			}

			&-hatch {
				stroke: url(#scroll-track-hatch);
				stroke-width: 20;
			}
		}

		.thumb {
			transition: stroke-dashoffset 0.2s cubic-bezier(0.4, 0, 0.2, 1);

			&-border {
				stroke: #4d4d4d;
				stroke-width: 16;
				stroke-linecap: round;
				filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.25));
			}

			&-fill {
				stroke: #c8c8c8;
				stroke-width: 14;
				stroke-linecap: round;
			}

			&-grooves {
				stroke: url(#scroll-thumb-grooves);
				stroke-width: 10;
			}
		}
	}
</style>
