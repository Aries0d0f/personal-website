<script lang="ts">
	import gsap from 'gsap';
	import { RoughEase } from 'gsap/EasePack';
	import { onMount, tick } from 'svelte';

	import { dev } from '$app/environment';
	import { useCRT } from '$lib/helpers/crt.svelte';

	gsap.registerPlugin(RoughEase);

	type Swap = () => void | Promise<void>;

	// How a tear reads against the picture: punched out of it, or flared through it.
	type SliceTone = 'black' | 'invert';

	interface Props {
		screen?: HTMLElement;
		active?: boolean;
	}

	let { screen, active = false }: Props = $props();

	const { register } = useCRT();

	const SLICES = [...Array(10).keys()];
	const JITTER = 'rough({ strength: 2.5, points: 32, template: none.out, randomize: true })';
	const COLLAPSE_AT = 1.55;

	const noop = () => {};

	let burst = $state(false);
	let burning = $state(false);
	let sliceTone = $state<SliceTone>('invert');

	let voidEl = $state<HTMLElement>();
	let lineEl = $state<HTMLElement>();
	let flashEl = $state<HTMLElement>();
	let staticEl = $state<HTMLElement>();
	let invertEl = $state<HTMLElement>();
	let redOffset = $state<SVGFEOffsetElement>();
	let cyanOffset = $state<SVGFEOffsetElement>();
	let sliceEls = $state<HTMLElement[]>([]);
	let devTools: { kill: () => void } | undefined;

	const signed = (amount: number) => (Math.random() - 0.5) * amount;

	// Collapse around the middle of the viewport, not of the (scrolled) page.
	const viewportCenter = () => `center ${window.scrollY + window.innerHeight / 2}px`;

	// Pulls the red and cyan guns apart. One tracker per timeline, so the offsets
	// stay continuous across the tweens that share it.
	function chromaSplitter(tl: gsap.core.Timeline) {
		const chroma = { split: 0 };

		return (split: number, duration: number, at: number, ease = JITTER) =>
			tl.to(
				chroma,
				{
					split,
					duration,
					ease,
					onUpdate: () => {
						redOffset?.setAttribute('dx', String(-chroma.split));
						cyanOffset?.setAttribute('dx', String(chroma.split));
					}
				},
				at
			);
	}

	// Drives the tube past its limits. Rides on the same filter as the chroma split,
	// so the brightness has to be rewritten alongside it rather than set on its own.
	function overdriver(tl: gsap.core.Timeline, el: HTMLElement) {
		const burn = { brightness: 1, contrast: 1 };

		return (brightness: number, contrast: number, duration: number, at: number, ease = 'none') =>
			tl.to(
				burn,
				{
					brightness,
					contrast,
					duration,
					ease,
					onUpdate: () => {
						el.style.filter = `url(#crt-chroma) brightness(${burn.brightness}) contrast(${burn.contrast})`;
					}
				},
				at
			);
	}

	function tearSlices(tl: gsap.core.Timeline, at: number, step: number, drift: number) {
		sliceEls.forEach((slice, i) => {
			tl.set(
				slice,
				{
					top: `${Math.random() * 100}%`,
					height: `${2 + Math.random() * 9}%`,
					xPercent: 0,
					opacity: 0
				},
				at + i * step
			).to(
				slice,
				{
					keyframes: [
						{ opacity: 1, xPercent: signed(drift), duration: 0.05 },
						{ xPercent: signed(drift), duration: 0.05 },
						{ opacity: 0, xPercent: 0, duration: 0.05 }
					]
				},
				at + i * step
			);
		});
	}

	function tearAndCollapse(el: HTMLElement) {
		const tl = gsap.timeline();
		const splitTo = chromaSplitter(tl);

		tl.set(el, { transformOrigin: viewportCenter() });

		// The set rattles before the picture gives out.
		tl.to(
			el,
			{
				keyframes: [
					{ x: -11, y: -9, duration: 0.04 },
					{ x: 10, y: 8, duration: 0.04 },
					{ x: -8, y: -6, duration: 0.04 },
					{ x: 7, y: 5, duration: 0.04 },
					{ x: -4, y: -3, duration: 0.04 },
					{ x: 0, y: 0, duration: 0.05 }
				],
				ease: 'none'
			},
			0
		);

		// Signal breaks up.
		splitTo(9, 0.34, 0.26);
		tl.fromTo(el, { skewX: 1.4 }, { skewX: 0, duration: 0.03, ease: JITTER }, 0.26);
		tl.to(voidEl!, { opacity: 0.12, duration: 0.5 }, 0.26);
		tearSlices(tl, 0.3, 0.035, 26);

		// Vertical hold fails: the frame slips and snaps back.
		tl.to(
			el,
			{
				keyframes: [
					{ y: -46, duration: 0.06 },
					{ y: 28, duration: 0.06 },
					{ y: -16, duration: 0.06 },
					{ y: 0, duration: 0.06 }
				],
				ease: 'none'
			},
			0.72
		);
		splitTo(18, 0.1, 0.72, 'none');
		splitTo(5, 0.14, 0.86, 'none');

		// Polarity stutter.
		tl.set(invertEl!, { opacity: 1 }, 0.99)
			.set(invertEl!, { opacity: 0 }, 1.04)
			.set(invertEl!, { opacity: 1 }, 1.11)
			.set(invertEl!, { opacity: 0 }, 1.15);

		// Second, faster tear storm on the way out.
		tearSlices(tl, 1.06, 0.022, 40);
		splitTo(24, 0.2, 1.2);
		tl.to(el, { skewX: -1.8, duration: 0.08, ease: 'none' }, 1.24).to(
			el,
			{ skewX: 0, duration: 0.08, ease: 'none' },
			1.32
		);

		// Deflection collapses.
		splitTo(0, 0.1, COLLAPSE_AT, 'power2.in');
		tl.to(voidEl!, { opacity: 1, duration: 0.1, ease: 'power2.in' }, COLLAPSE_AT)
			.to(
				el,
				{ scaleY: 0.004, scaleX: 1.04, x: 0, y: 0, skewX: 0, duration: 0.14, ease: 'power4.in' },
				COLLAPSE_AT
			)
			.fromTo(flashEl!, { opacity: 0 }, { opacity: 0.9, duration: 0.06 }, COLLAPSE_AT + 0.02)
			.to(flashEl!, { opacity: 0, duration: 0.12 }, COLLAPSE_AT + 0.08)
			.fromTo(
				lineEl!,
				{ scaleX: 1.02, scaleY: 6, opacity: 0 },
				{ scaleY: 1, opacity: 1, duration: 0.12, ease: 'power3.out' },
				COLLAPSE_AT + 0.1
			)
			.to(lineEl!, { scaleX: 0.001, duration: 0.16, ease: 'power2.inOut' }, COLLAPSE_AT + 0.32)
			.to(lineEl!, { opacity: 0, duration: 0.16, ease: 'power2.inOut' }, '<+=0.16');

		return tl;
	}

	// The picture takes a hit and rides it out: no collapse, nothing swapped underneath.
	function interference(el: HTMLElement) {
		const tl = gsap.timeline();
		const splitTo = chromaSplitter(tl);

		tl.set(el, { transformOrigin: viewportCenter() });

		// The set flinches.
		tl.to(
			el,
			{
				keyframes: [
					{ x: -9, y: 7, duration: 0.04 },
					{ x: 8, y: -6, duration: 0.04 },
					{ x: -5, y: 4, duration: 0.04 },
					{ x: 0, y: 0, duration: 0.05 }
				],
				ease: 'none'
			},
			0
		);

		splitTo(14, 0.18, 0);
		tl.fromTo(el, { skewX: -1.6 }, { skewX: 0, duration: 0.16, ease: JITTER }, 0);
		tl.to(voidEl!, { opacity: 0.1, duration: 0.12 }, 0);
		tearSlices(tl, 0.02, 0.03, 34);

		// Vertical hold slips, then catches.
		tl.to(
			el,
			{
				keyframes: [
					{ y: -30, duration: 0.05 },
					{ y: 18, duration: 0.05 },
					{ y: 0, duration: 0.06 }
				],
				ease: 'none'
			},
			0.42
		);
		splitTo(20, 0.08, 0.42, 'none');

		tl.set(invertEl!, { opacity: 1 }, 0.5).set(invertEl!, { opacity: 0 }, 0.55);

		// It settles, but never quite back to where it was.
		tearSlices(tl, 0.56, 0.022, 44);
		splitTo(6, 0.2, 0.62);
		splitTo(0, 0.26, 0.86, 'power2.out');
		tl.to(voidEl!, { opacity: 0, duration: 0.4 }, 0.62);

		return tl;
	}

	// The tube pulls more and more current until the picture is gone inside its own light.
	function burnOut(el: HTMLElement) {
		const tl = gsap.timeline();
		const splitTo = chromaSplitter(tl);
		const burnTo = overdriver(tl, el);

		tl.set(el, { transformOrigin: viewportCenter() });
		tl.set(staticEl!, { opacity: 0 });

		// Creeping overexposure. The static rises with the brightness.
		burnTo(2.4, 1.4, 1.7, 0, 'power2.in');
		tl.to(staticEl!, { opacity: 0.55, duration: 1.7, ease: 'power2.in' }, 0);
		splitTo(7, 1.7, 0);
		tearSlices(tl, 0.7, 0.055, 18);

		// Past saving.
		burnTo(6, 2.4, 0.6, 1.7, 'power3.in');
		tl.to(staticEl!, { opacity: 0.95, duration: 0.6, ease: 'power3.in' }, 1.7);
		splitTo(26, 0.6, 1.7, 'none');
		tearSlices(tl, 1.7, 0.02, 46);
		tl.to(
			el,
			{
				keyframes: [
					{ y: -12, duration: 0.05 },
					{ y: 9, duration: 0.05 },
					{ y: -6, duration: 0.05 },
					{ y: 0, duration: 0.05 }
				],
				ease: 'none'
			},
			1.8
		);

		// Blowout. The swap happens inside the white, so the cut is never seen.
		tl.fromTo(flashEl!, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.in' }, 2.3)
			.to(el, { scale: 1.03, duration: 0.32, ease: 'power2.in' }, 2.3)
			.to(staticEl!, { opacity: 0, duration: 0.22 }, 3.42);

		return tl;
	}

	// Whatever is underneath comes back out of the afterglow.
	function fadeUp() {
		return gsap.timeline().to(flashEl!, { opacity: 0, duration: 1, ease: 'power2.out' }, 0.15);
	}

	function sweepOpen(el: HTMLElement) {
		return gsap
			.timeline()
			.set(el, {
				transformOrigin: viewportCenter(),
				opacity: 1,
				scaleY: 0.004,
				scaleX: 1.04,
				delay: 1
			})
			.set(lineEl!, { opacity: 1 })
			.to(lineEl!, { scaleX: 1, duration: 0.225, ease: 'power2.out' })
			.to(lineEl!, { opacity: 0, duration: 0.18 })
			.to(el, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'expo.out', delay: 0.1 }, '<')
			.to(voidEl!, { opacity: 0, duration: 0.45, ease: 'power2.out' }, '<+=0.05');
	}

	// One master timeline so GSDevTools has a single thing to bind to. Without a
	// `swap` it plays straight through, which is what makes it scrubbable.
	function buildCycle(el: HTMLElement, swap?: () => void | Promise<void>) {
		const tl = gsap.timeline({ id: 'crt', paused: true });

		tl.add(tearAndCollapse(el));

		if (swap) {
			// The swap happens while the screen is dark, so it is never seen. Resume no
			// matter how it goes: a swap that throws must not leave the tube stuck shut.
			tl.addPause(tl.duration(), async () => {
				try {
					el.style.filter = '';
					await swap();
					await tick();
				} finally {
					tl.play();
				}
			});
		}

		tl.add(sweepOpen(el));

		return tl;
	}

	function buildBurnOut(el: HTMLElement, swap?: Swap) {
		const tl = gsap.timeline({ id: 'crt-burn', paused: true });

		tl.add(burnOut(el));

		if (swap) {
			// The swap happens inside the blowout, while the screen is pure white. Resume no
			// matter how it goes: a swap that throws must not leave the screen white forever.
			tl.addPause(tl.duration(), async () => {
				try {
					disarmScreen(el);
					await swap();
					await tick();
				} finally {
					tl.play();
				}
			});
		}

		tl.add(fadeUp());

		return tl;
	}

	function armScreen(el: HTMLElement) {
		el.style.filter = 'url(#crt-chroma)';
		el.style.willChange = 'transform, filter';
	}

	function disarmScreen(el: HTMLElement) {
		gsap.set(el, { clearProps: 'transform,transformOrigin' });
		el.style.filter = '';
		el.style.willChange = '';
		redOffset?.setAttribute('dx', '0');
		cyanOffset?.setAttribute('dx', '0');
	}

	// Mounts the burst layers, runs the timeline against the armed screen, and puts
	// the screen back the way it was found — whatever the timeline did to it.
	async function play(
		build: (el: HTMLElement) => gsap.core.Timeline,
		swap: Swap,
		tone: SliceTone = 'invert'
	) {
		const el = screen;
		if (!el) {
			await swap();
			return;
		}

		sliceTone = tone;
		burst = true;
		await tick();
		armScreen(el);

		try {
			await build(el).play();
		} finally {
			disarmScreen(el);
			burst = false;
		}
	}

	// `swap` is folded into the timeline so it lands on the one frame that hides it,
	// and is passed to `play` only as the fallback for when there is no screen to animate.
	//
	// On the way in the tube is losing its picture, so the tears punch black holes in it.
	// Once the game is on and the tube is overloading, they flare through it instead.
	const powerCycle = (swap: Swap) => play((el) => buildCycle(el, swap), swap, 'black');

	// The tube is losing its vertical hold long before it gives out, so the roll stops
	// rolling and starts jumping. Flagged for the whole cycle, not just the overload.
	const burnOutCycle = async (swap: Swap) => {
		burning = true;

		try {
			await play((el) => buildBurnOut(el, swap), swap, 'invert');
		} finally {
			burning = false;
		}
	};

	// Nothing to hide: the picture stays up the whole way through, so nothing is swapped.
	const interferenceCycle = () => play(interference, noop, 'invert');

	// Dev-only: `crt.debug()` in the console builds a cycle without the page swap and
	// hands it to GSDevTools, so it can be scrubbed in place. Pass 'burn' for the other one.
	async function openDevTools(cycle: 'power' | 'burn' = 'power') {
		const el = screen;
		if (!import.meta.env.DEV || !el) return;

		sliceTone = cycle === 'burn' ? 'invert' : 'black';
		burning = cycle === 'burn';
		burst = true;
		await tick();
		armScreen(el);

		const { GSDevTools } = await import('gsap/GSDevTools');
		gsap.registerPlugin(GSDevTools);

		devTools?.kill();
		devTools = GSDevTools.create({
			animation: cycle === 'burn' ? buildBurnOut(el) : buildCycle(el),
			persist: true
		});

		// The overlay sits at 9999 and would bury the scrubber under the void.
		const ui = document.querySelector<HTMLElement>('.gs-dev-tools');
		if (ui) ui.style.zIndex = '10000';
	}

	function closeDevTools() {
		devTools?.kill();
		devTools = undefined;

		if (screen) disarmScreen(screen);
		burning = false;
		burst = false;
	}

	onMount(() => {
		const unregister = register({
			powerCycle,
			interference: interferenceCycle,
			burnOut: burnOutCycle
		});

		if (dev) {
			window.crt = {
				debug: openDevTools,
				close: closeDevTools,
				preview: powerCycle,
				glitch: interferenceCycle,
				burn: burnOutCycle
			};
		}

		return () => {
			unregister();
			if (dev) delete window.crt;
		};
	});
</script>

<svg class="crt-defs" aria-hidden="true" focusable="false">
	<filter id="crt-chroma" x="-10%" y="-10%" width="120%" height="120%">
		<feColorMatrix
			in="SourceGraphic"
			type="matrix"
			result="red"
			values="1 0 0 0 0
			        0 0 0 0 0
			        0 0 0 0 0
			        0 0 0 1 0"
		/>
		<feOffset in="red" dx="0" dy="0" result="red-shifted" bind:this={redOffset} />
		<feColorMatrix
			in="SourceGraphic"
			type="matrix"
			result="cyan"
			values="0 0 0 0 0
			        0 1 0 0 0
			        0 0 1 0 0
			        0 0 0 1 0"
		/>
		<feOffset in="cyan" dx="0" dy="0" result="cyan-shifted" bind:this={cyanOffset} />
		<feBlend in="red-shifted" in2="cyan-shifted" mode="screen" />
	</filter>
</svg>

{#if burst || active}
	<div class="crt" aria-hidden="true">
		<div class="crt-void" bind:this={voidEl}></div>

		{#if burst}
			<div class="crt-invert" bind:this={invertEl}></div>
			{#each SLICES as i (i)}
				<div class="crt-slice" class:black={sliceTone === 'black'} bind:this={sliceEls[i]}></div>
			{/each}
		{/if}

		{#if active}
			<div class="crt-scanlines"></div>
			<div class="crt-band" class:flicking={burning}></div>
			<div class="crt-grain"></div>
			<div class="crt-vignette"></div>
			<div class="crt-glimmer"></div>
			<div class="crt-glass"></div>
		{/if}

		{#if burst}
			<div class="crt-static" bind:this={staticEl}></div>
			<div class="crt-line" bind:this={lineEl}></div>
			<div class="crt-flash" bind:this={flashEl}></div>
		{/if}

		{#if active}
			<div class="crt-bezel"></div>
		{/if}
	</div>
{/if}

<style lang="scss">
	// The face of a tube is where two very flat ellipses overlap: a tall one bowing
	// the left and right edges, a wide one bowing the top and bottom. How far each
	// reaches past the viewport sets how hard the picture wraps — the closer to
	// 50% / 50%, the rounder (and older) the tube.
	$bow-tight: 52%;
	$bow-wide: 118%;

	$face:
		radial-gradient(ellipse $bow-tight $bow-wide at 50% 50%, #000 99%, transparent 100%),
		radial-gradient(ellipse $bow-wide $bow-tight at 50% 50%, #000 99%, transparent 100%);

	// Everything the face leaves out: the union of the two ellipses' outsides.
	$surround:
		radial-gradient(ellipse $bow-tight $bow-wide at 50% 50%, transparent 98.6%, #000 99.6%),
		radial-gradient(ellipse $bow-wide $bow-tight at 50% 50%, transparent 98.6%, #000 99.6%);

	.crt {
		position: fixed;
		inset: 0;
		z-index: 9999;
		pointer-events: none;
		overflow: hidden;

		> * {
			position: absolute;
			inset: 0;
		}

		&-defs {
			position: absolute;
			width: 0;
			height: 0;
			pointer-events: none;
		}

		&-void {
			z-index: 1;
			background-color: #000;
			opacity: 0;
		}

		&-invert {
			z-index: 2;
			opacity: 0;
			backdrop-filter: invert(1);
			-webkit-backdrop-filter: invert(1);
		}

		&-slice {
			z-index: 2;
			inset: auto auto auto -5%;
			width: 110%;
			opacity: 0;
			backdrop-filter: invert(1) hue-rotate(75deg) saturate(2);
			-webkit-backdrop-filter: invert(1) hue-rotate(75deg) saturate(2);

			&.black {
				background-color: rgba(0, 0, 0, 0.75);
				backdrop-filter: none;
				-webkit-backdrop-filter: none;
			}
		}

		&-scanlines {
			z-index: 3;
			background-image: repeating-linear-gradient(
				to bottom,
				rgba(0, 0, 0, 0) 0 2px,
				rgba(0, 0, 0, 0.26) 2px 3px,
				rgba(0, 0, 0, 0.4) 3px 4px
			);
		}

		&-band {
			z-index: 3;
			inset: 0 0 auto 0;
			height: 40%;
			background-image: linear-gradient(
				to bottom,
				rgba(255, 255, 255, 0) 0%,
				rgba(255, 255, 255, 0.04) 45%,
				rgba(255, 255, 255, 0.07) 50%,
				rgba(255, 255, 255, 0.04) 55%,
				rgba(255, 255, 255, 0) 100%
			);
			transform: translateY(-110%);
		}

		&-grain {
			z-index: 4;
			opacity: 0.04;
			background-image: url('../assets/crt-noise.svg');
		}

		&-vignette {
			z-index: 5;
			background-image: radial-gradient(
				ellipse at center,
				rgba(0, 0, 0, 0) 45%,
				rgba(0, 0, 0, 0.55) 100%
			);
			box-shadow: inset 0 0 12rem rgba(0, 0, 0, 0.9);
		}

		&-glimmer {
			z-index: 6;
			background-color: #fff;
			opacity: 0;
		}

		// Curved glass: the picture falls away as it wraps around the edge of the
		// tube, with a sheen where the room lands on it and a highlight along the rim.
		&-glass {
			z-index: 7;
			background-image:
				radial-gradient(
					ellipse 60% 45% at 24% 12%,
					rgba(255, 255, 255, 0.05),
					rgba(255, 255, 255, 0) 65%
				),
				radial-gradient(
					ellipse $bow-tight $bow-wide at 50% 50%,
					rgba(255, 255, 255, 0) 98.4%,
					rgba(255, 255, 255, 0.1) 100%
				),
				radial-gradient(
					ellipse $bow-wide $bow-tight at 50% 50%,
					rgba(255, 255, 255, 0) 98.4%,
					rgba(255, 255, 255, 0.1) 100%
				),
				radial-gradient(
					ellipse $bow-tight $bow-wide at 50% 50%,
					rgba(0, 0, 0, 0) 92%,
					rgba(0, 0, 0, 0.45) 100%
				),
				radial-gradient(
					ellipse $bow-wide $bow-tight at 50% 50%,
					rgba(0, 0, 0, 0) 92%,
					rgba(0, 0, 0, 0.45) 100%
				);
			mask-image: $face;
			mask-composite: intersect;
		}

		// Unlit glass outside the face. Sits above the burst layers so the corners
		// stay dark even while the tube flashes.
		&-bezel {
			z-index: 12;
			background-color: #000;
			mask-image: $surround;
		}

		// The grain the tube always has, turned all the way up. Screened, so it adds
		// light rather than veiling the picture: the noise is what makes it brighter.
		&-static {
			z-index: 8;
			opacity: 0;
			background-image: url('../assets/crt-noise.svg');
			mix-blend-mode: screen;
		}

		&-line {
			z-index: 10;
			inset: 50% 0 auto 0;
			height: 2px;
			margin-top: -1px;
			transform-origin: center;
			background-color: #fff;
			box-shadow:
				0 0 18px 3px rgba(255, 255, 255, 0.85),
				0 0 60px 10px rgba(200, 230, 255, 0.45);
			opacity: 0;
		}

		&-flash {
			z-index: 11;
			background-color: #fff;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.crt {
			&-scanlines {
				animation: crt-drift 8s linear infinite;
			}

			&-band {
				animation: crt-roll 7s linear infinite;

				// Vertical hold gone: the band snaps between two positions instead of
				// sliding through them. `steps` is what sells it — an interpolated
				// travel this short would read as a hum, not a flick.
				&.flicking {
					animation: crt-roll-flicking 0.06s steps(2, jump-none) infinite alternate;
				}
			}

			&-grain {
				animation: crt-noise 0.5s steps(4) infinite;
			}

			&-static {
				animation: crt-noise 0.1s steps(4) infinite;
			}

			&-glimmer {
				animation: crt-glimmer 5s steps(1) infinite;
			}
		}
	}

	@keyframes crt-drift {
		to {
			background-position-y: 4px;
		}
	}

	@keyframes crt-roll {
		to {
			transform: translateY(260%);
		}
	}

	@keyframes crt-roll-flicking {
		from {
			transform: translateY(20%);
		}
		to {
			transform: translateY(22%);
		}
	}

	@keyframes crt-noise {
		0% {
			background-position:
				0 0,
				0 0;
		}
		25% {
			background-position:
				-40px 30px,
				0 0;
		}
		50% {
			background-position:
				30px -20px,
				0 0;
		}
		75% {
			background-position:
				-20px -40px,
				0 0;
		}
		100% {
			background-position:
				40px 20px,
				0 0;
		}
	}

	@keyframes crt-glimmer {
		0%,
		96% {
			opacity: 0;
		}
		97% {
			opacity: 0.035;
		}
		98% {
			opacity: 0;
		}
		99% {
			opacity: 0.02;
		}
	}
</style>
