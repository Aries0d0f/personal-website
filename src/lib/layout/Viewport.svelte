<script lang="ts">
	import gsap from 'gsap';
	import { Observer } from 'gsap/Observer';
	import { onMount, tick } from 'svelte';

	import { afterNavigate, goto, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import Avatar from '$lib/components/Avatar.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import AllSections from '$lib/layout/AllSections.svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { pageOrder, pageHref, type PageKey } from '$lib/pages';

	gsap.registerPlugin(Observer);

	const MOBILE_BREAKPOINT = 840;

	let { children } = $props();

	let width = $state(0);
	let height = $state(0);
	let mounted = $state(false);

	const isDesktop = $derived(width > MOBILE_BREAKPOINT);
	const showCombined = $derived(mounted && !isDesktop);

	let observer: Observer | undefined;
	let lastDirection: 1 | -1 = 1;

	let sectionObserver: IntersectionObserver | undefined;
	let sectionEls: HTMLElement[] = [];
	let currentSectionKey: PageKey | null = null;

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

	function handleKeyNavigation(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowRight':
			case 'Enter':
			case ' ':
			case 'PageDown':
				event.preventDefault();
				switchPage(1);
				break;
			case 'ArrowUp':
			case 'ArrowLeft':
			case 'PageUp':
				event.preventDefault();
				switchPage(-1);
				break;
		}
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
				width > 840
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

	function syncRouteToSection(key: PageKey) {
		replaceState(resolve(pageHref(key, getLocale())), page.state);
	}

	function activeSectionKey(): PageKey | null {
		if (!sectionEls.length) return null;

		const line = window.innerHeight / 2;
		let active = sectionEls[0];
		for (const el of sectionEls) {
			if (el.getBoundingClientRect().top <= line) active = el;
			else break;
		}

		return active.id.replace('section-', '') as PageKey;
	}

	function handleSectionChange() {
		const key = activeSectionKey();
		if (!key || key === currentSectionKey) return;

		currentSectionKey = key;
		syncRouteToSection(key);
	}

	function setupSectionObserver() {
		sectionObserver?.disconnect();

		sectionEls = pageOrder
			.map((key) => document.getElementById(`section-${key}`))
			.filter((el): el is HTMLElement => el !== null);

		if (!sectionEls.length) return;

		sectionObserver = new IntersectionObserver(handleSectionChange, {
			rootMargin: '-50% 0px -50% 0px',
			threshold: 0
		});

		sectionEls.forEach((el) => sectionObserver?.observe(el));
	}

	async function scrollToSection(pathname: string) {
		const key = pageKeyFromPath(pathname);
		if (!key) return;

		currentSectionKey = key;

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

	$effect(() => {
		if (!showCombined) {
			sectionObserver?.disconnect();
			sectionObserver = undefined;
			return;
		}

		currentSectionKey = pageKeyFromPath(page.url.pathname);

		tick().then(() => {
			if (showCombined) setupSectionObserver();
		});

		return () => {
			sectionObserver?.disconnect();
			sectionObserver = undefined;
		};
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

<svelte:window bind:innerWidth={width} bind:innerHeight={height} onkeydown={handleKeyNavigation} />

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
</div>

<style lang="scss">
	.viewport-wrapper {
		width: 100%;
		min-height: 100dvh;
		display: flex;
		place-items: center;
		place-content: center;
		overflow: hidden;

		@media (max-width: 840px) {
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

			@media (max-width: 840px) {
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

			@media ((max-height: 900px) and (orientation: portrait)) or (max-height: 500px) or (max-width: 840px) {
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

			@media (min-width: 840px) {
				width: 340px;
			}
		}
	}
</style>
