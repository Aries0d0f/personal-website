<script lang="ts">
	import gsap from 'gsap';
	import { Observer } from 'gsap/Observer';
	import { onMount, tick } from 'svelte';

	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import Avatar from '$lib/components/Avatar.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import AllSections from '$lib/layout/AllSections.svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { pageOrder, pageHref } from '$lib/pages';

	gsap.registerPlugin(Observer);

	const MOBILE_BREAKPOINT = 800;

	let { children } = $props();

	let width = $state(0);
	let height = $state(0);
	let mounted = $state(false);

	const isDesktop = $derived(width > MOBILE_BREAKPOINT);
	const showCombined = $derived(mounted && !isDesktop);

	let observer: Observer | undefined;
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

		observer?.disable();

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
			.set('menu', {
				opacity: 0,
				translateX: '100%'
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
			)
			.fromTo(
				'menu',
				{
					opacity: 0,
					translateX: '100%'
				},
				{
					opacity: 1,
					translateX: '0%',
					duration: 0.5,
					ease: 'power3.out'
				},
				'<'
			);
	}

	function pageKeyFromPath(pathname: string) {
		return pageOrder.find((key) => pageHref(key, getLocale()) === pathname) ?? null;
	}

	async function scrollToSection(pathname: string) {
		const key = pageKeyFromPath(pathname);
		if (!key) return;

		if (key === 'home') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}

		await tick();

		setTimeout(() => {
			document.getElementById(`section-${key}`)?.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}, 300);
	}

	afterNavigate(({ type }) => {
		if (type === 'enter') return;

		if (isDesktop) {
			animateIn();
		} else {
			scrollToSection(page.url.pathname);
		}
	});

	$effect(() => {
		if (!mounted) return;

		if (isDesktop) {
			observer ??= Observer.create({
				target: window,
				type: 'wheel,touch',
				wheelSpeed: -1,
				tolerance: 10,
				preventDefault: true,
				onUp: () => switchPage(1),
				onDown: () => switchPage(-1)
			});
		} else {
			observer?.kill();
			observer = undefined;
		}
	});

	let didInitialScroll = false;
	$effect(() => {
		if (showCombined && !didInitialScroll) {
			didInitialScroll = true;
			scrollToSection(page.url.pathname);
		}
	});

	onMount(() => {
		mounted = true;

		if (showCombined) {
			if (pageKeyFromPath(page.url.pathname) === 'home') {
				startAnimation();
			} else {
				gsap.set('.intro-content', { opacity: 1, display: 'flex', clearProps: 'transform' });
				gsap.set('menu', { opacity: 1, translateX: '0%' });
				scrollToSection(page.url.pathname);
			}
		} else {
			startAnimation();
		}

		return () => observer?.kill();
	});
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<div class="viewport-wrapper">
	<main class="intro-container" class:combined={showCombined}>
		<div class="intro-avatar">
			<Avatar {width} {height} />
		</div>
		<div class="intro-content" style="opacity: 0">
			{#if showCombined}
				<AllSections />
			{:else}
				{@render children()}
			{/if}
		</div>
	</main>
	{#if !showCombined}
		<Menu />
	{/if}

	<style>
		menu {
			opacity: 0;
			transform: translateX(100%);
		}
	</style>
</div>

<style lang="scss">
	.viewport-wrapper {
		width: 100%;
		min-height: 100vh;
		display: flex;
		place-items: center;
		place-content: center;
		overflow: hidden;

		@media (max-width: 800px) {
			place-items: start;
			place-content: start;
			overflow: visible;
		}
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
