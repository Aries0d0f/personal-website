<script lang="ts">
	import gsap from 'gsap';
	import { Observer } from 'gsap/Observer';
	import { onMount } from 'svelte';

	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import Avatar from '$lib/components/Avatar.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { pageOrder, pageHref } from '$lib/pages';

	gsap.registerPlugin(Observer);

	let { children } = $props();

	let width = $state(0);
	let height = $state(0);

	// Scroll / swipe driven page switching across the ordered pages.
	// No lock state: while a transition runs we simply pause the Observer's
	// input, then resume it the instant the in-animation finishes. The "ignore
	// window" is therefore exactly the transition itself — so one flick (and all
	// of its momentum events) can only ever produce a single switch.
	let observer: Observer;
	let lastDirection: 1 | -1 = 1;

	function resolveTarget(direction: 1 | -1) {
		const hrefs = pageOrder.map((key) => pageHref(key, getLocale()));
		const currentIndex = hrefs.findIndex((href) => href === page.url.pathname);
		if (currentIndex === -1) return null;

		const targetIndex = currentIndex + direction;
		if (targetIndex < 0 || targetIndex >= hrefs.length) return null;

		return hrefs[targetIndex];
	}

	function switchPage(direction: 1 | -1) {
		const href = resolveTarget(direction);
		if (!href) return;

		lastDirection = direction;

		// Stop listening for the duration of the transition; `animateIn` resumes
		// it. Momentum events that arrive meanwhile are simply not observed.
		observer.disable();

		gsap.to('.intro-content', {
			opacity: 0,
			y: direction * -60,
			duration: 0.4,
			ease: 'power2.in',
			onComplete: () => goto(resolve(href))
		});
	}

	function animateIn() {
		gsap.fromTo(
			'.intro-content',
			{ opacity: 0, y: lastDirection * 60 },
			{
				opacity: 1,
				y: 0,
				duration: 0.5,
				ease: 'power3.out',
				clearProps: 'transform',
				// Transition finished — start listening for the next gesture again.
				onComplete: () => observer?.enable()
			}
		);
	}

	function startAnimation() {
		const tl = gsap.timeline();
		tl.set('.intro-content', {
			opacity: 0,
			translateX: -200
		})
			.fromTo(
				'.intro-content',
				width > 800
					? {
							marginLeft: -320,
							display: 'none',
							translateX: -200
						}
					: {
							marginTop: -240,
							display: 'flex',
							translateX: 0
						},
				{
					marginLeft: 0,
					marginTop: 0,
					display: 'flex',
					translateX: 0,
					duration: 1,
					ease: 'power3.out'
				},
				'<+=2.2'
			)
			.fromTo(
				'.intro-content',
				{
					opacity: 0
				},
				{
					opacity: 1,
					duration: 0.5,
					ease: 'power3.out'
				},
				'<+=0.3'
			);
	}

	afterNavigate(({ type }) => {
		if (type === 'enter') return;
		animateIn();
	});

	onMount(() => {
		startAnimation();

		observer = Observer.create({
			target: window,
			type: 'wheel,touch',
			wheelSpeed: -1,
			tolerance: 10,
			preventDefault: true,
			onUp: () => switchPage(1),
			onDown: () => switchPage(-1)
		});

		return () => observer.kill();
	});
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<div class="viewport-wrapper">
	<main class="intro-container">
		<div class="intro-avatar">
			<Avatar {width} {height} />
		</div>
		<div class="intro-content" style="opacity: 0">
			{@render children()}
		</div>
	</main>
	<Menu />
</div>

<style lang="scss">
	.viewport-wrapper {
		width: 100%;
		min-height: 100vh;
		display: flex;
		place-items: center;
		place-content: center;
		overflow: hidden;
	}

	.intro {
		&-container {
			display: flex;
			place-items: center;
			place-content: center;
			flex-direction: row;
			width: fit-content;
			height: fit-content;

			@media (max-width: 800px) {
				flex-direction: column;
				place-content: start;
				gap: 2rem;

				> .intro-content {
					max-width: 80%;
					padding: 1rem;
				}
			}

			@media (max-width: 414px) {
				> .intro-content {
					max-width: unset;
					padding: 1rem;
				}
			}
		}

		&-avatar {
			margin-top: -5rem;
			transition: margin-top 0.3s ease;

			@media ((max-height: 900px) and (orientation: portrait)) or (max-height: 500px) or (max-width: 800px) {
				margin-top: 0;
			}

			z-index: 2;
		}

		&-content {
			display: flex;
			flex-direction: column;
			max-width: 340px;
			line-height: 1.6;
			white-space: pre-wrap;
			gap: 4rem;
			z-index: 1;

			@media (min-width: 800px) {
				width: 340px;
			}
		}
	}
</style>
