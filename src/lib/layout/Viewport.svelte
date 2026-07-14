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
	import { Abnormality } from '$lib/game/abnoramlity';
	import { useGameStore } from '$lib/store/game';
	import { useCRT } from '$lib/helpers/crt.svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { pageOrder, pageHref } from '$lib/pages';
	import ScrollIndicator from '$lib/components/ScrollIndicator.svelte';

	import type { PageKey } from '$lib/pages';

	gsap.registerPlugin(Observer);

	const MOBILE_BREAKPOINT = 840;

	const KONAMI_CODE = [
		'ArrowUp',
		'ArrowUp',
		'ArrowDown',
		'ArrowDown',
		'ArrowLeft',
		'ArrowRight',
		'ArrowLeft',
		'ArrowRight',
		'b',
		'a'
	];

	let { children } = $props();

	const { isGameMode, isGameCleared, abnormality, challengeStage } = useGameStore();
	const { powerCycle, underGlass } = useCRT();

	let width = $state(0);
	let height = $state(0);
	let mounted = $state(false);
	let sequence: string[] = $state([]);
	let konamiTimer = $state<ReturnType<typeof setTimeout>>();

	const isDesktop = $derived(width > MOBILE_BREAKPOINT);
	const showCombined = $derived(mounted && !isDesktop);

	let observer: Observer | undefined;
	let lastDirection: 1 | -1 = 1;

	// Modal <dialog>s (game options, codex) sit above the viewport but the wheel Observer
	// listens on window, so a scroll inside them would still page-switch underneath.
	// `toggle` doesn't bubble, but a capture-phase listener on document still sees it.
	let dialogOpen = $state(false);

	function syncDialogState() {
		dialogOpen = !!document.querySelector('dialog[open]');
	}

	let sectionObserver: IntersectionObserver | undefined;
	let sectionEls: HTMLElement[] = [];
	let currentSectionKey: PageKey | null = null;

	function resolveTarget(direction: 1 | -1) {
		const hrefs = pageOrder
			.filter((key) => $isGameMode || !key.includes('blank'))
			.map((key) => pageHref(key, getLocale()));
		const currentIndex = hrefs.findIndex((href) => href === page.url.pathname);
		if (currentIndex === -1) return null;

		const targetIndex = currentIndex + direction;
		if (targetIndex < 0 || targetIndex >= hrefs.length) return null;

		return hrefs[targetIndex];
	}

	function switchPage(direction: 1 | -1) {
		const href = resolveTarget(direction);
		if ($isGameMode) {
			if ($isGameCleared || document.querySelector('dialog[open]')) {
				observer?.disable();
				return;
			}

			if (href && !href.includes('blank')) {
				performPageSwitch(direction, href);
			} else {
				handleGameStageSwitch(direction, () => {
					if (direction === 1) {
						performPageSwitch(direction, `/${getLocale()}`);
					} else {
						setTimeout(() => {
							performPageSwitch(direction, `/${getLocale()}`);
						}, 400);
					}
				});
			}
		} else {
			if (!href) {
				return;
			}

			performPageSwitch(direction, href);
		}
	}

	function performPageSwitch(direction: 1 | -1, href: `/${string}`) {
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

	async function handleGameStageSwitch(direction: 1 | -1, onFinish: () => void) {
		if (direction === -1) {
			observer?.disable();
			performPageSwitch(direction, `/${getLocale()}/blank`);
			observer?.disable();
			// sleep for 400ms to allow the page transition to complete before challenging the stage
			await new Promise((resolve) => setTimeout(resolve, 400));
		} else if (direction === 1) {
			observer?.disable();
			performPageSwitch(direction, `/${getLocale()}/blank-after`);
			observer?.disable();
			// sleep for 400ms to allow the page transition to complete before challenging the stage
			await new Promise((resolve) => setTimeout(resolve, 400));
		}
		await challengeStage(direction);
		onFinish();
	}

	const isPrefix = (keys: string[]) => keys.every((key, i) => key === KONAMI_CODE[i]);

	// True once the key belongs to the konami code rather than to page navigation,
	// so the arrows stop paging the site out from under the sequence.
	function konamiConsumes(event: KeyboardEvent) {
		const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

		const next = [...sequence, key];
		while (next.length && !isPrefix(next)) next.shift();
		sequence = next;

		if (konamiTimer) clearTimeout(konamiTimer);
		konamiTimer = setTimeout(() => {
			sequence = [];
		}, 1500);

		if (sequence.length === KONAMI_CODE.length) {
			clearTimeout(konamiTimer);
			sequence = [];
			startGameMode();
			return true;
		}

		return sequence.length >= 5;
	}

	function handleKeyNavigation(event: KeyboardEvent) {
		if (!isDesktop || event.altKey || event.ctrlKey || event.metaKey) return;

		if (konamiConsumes(event)) {
			event.preventDefault();
			return;
		}

		if (event.shiftKey) return;

		switch (event.key) {
			case 's':
			case 'd':
				if (!$isGameMode) break;
				event.preventDefault();
				switchPage(1);
				break;
			case 'ArrowDown':
			case 'ArrowRight':
			case 'Enter':
			case ' ':
			case 'PageDown':
				event.preventDefault();
				switchPage(1);
				break;
			case 'w':
			case 'a':
				if (!$isGameMode) break;
				event.preventDefault();
				switchPage(-1);
				break;
			case 'ArrowUp':
			case 'ArrowLeft':
			case 'PageUp':
				event.preventDefault();
				switchPage(-1);
				break;
		}
	}

	function startGameMode() {
		observer?.disable();
		gsap.killTweensOf('.intro-content');

		void powerCycle(() => goto(resolve(`/${getLocale()}/game`)));
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

	let readyForScreenEffect = $state<Abnormality | false>(false);

	$effect(() => {
		if (
			$isGameMode &&
			$abnormality &&
			[
				Abnormality.AN18,
				Abnormality.AN19,
				Abnormality.AN20,
				Abnormality.AN21,
				Abnormality.AN22,
				Abnormality.AN23
			].includes($abnormality)
		) {
			if (page.url.pathname === pageHref('experience', getLocale())) {
				readyForScreenEffect = $abnormality;
			}
		} else {
			readyForScreenEffect = false;
		}

		if (
			$isGameMode &&
			(readyForScreenEffect !== $abnormality ||
				page.url.pathname === pageHref('blank', getLocale()) ||
				page.url.pathname === pageHref('blank-after', getLocale()))
		) {
			gsap.globalTimeline.getById('red-screen')?.kill();
			gsap.set('.viewport-wrapper', { clearProps: 'all' });
			gsap.set('.game-dialog', { clearProps: 'all' });
			readyForScreenEffect = false;
		}
	});

	const showRedScreen = $derived(
		$isGameMode && $abnormality === Abnormality.AN18 && readyForScreenEffect
	);
	const showMonochromeScreen = $derived(
		$isGameMode && $abnormality === Abnormality.AN19 && readyForScreenEffect
	);

	const showInvertScreen = $derived(
		$isGameMode && $abnormality === Abnormality.AN20 && readyForScreenEffect
	);

	const showNoiseScreen = $derived(
		$isGameMode && $abnormality === Abnormality.AN21 && readyForScreenEffect
	);

	const turnOffScreen = $derived(
		$isGameMode && $abnormality === Abnormality.AN22 && readyForScreenEffect
	);

	const showBreakScreen = $derived(
		$isGameMode && $abnormality === Abnormality.AN23 && readyForScreenEffect
	);

	$effect(() => {
		if (showRedScreen) redScreenEffect();
	});

	$effect(() => {
		if (showNoiseScreen) {
			gsap.set('.game-dialog', { opacity: 0 });
		}
	});

	let resumeFromTurnOff: (() => void) | undefined;

	$effect(() => {
		if (turnOffScreen) {
			turnOffScreenEffect();
		} else if (resumeFromTurnOff) {
			resumeFromTurnOff();
			resumeFromTurnOff = undefined;
		}
	});

	afterNavigate(({ type }) => {
		if (type === 'enter') return;

		if (isDesktop) {
			animateIn();
		} else {
			scrollToSection(page.url.pathname);
		}
	});

	function redScreenEffect() {
		const tl = gsap.timeline({ id: 'red-screen' });
		tl.set('.red-screen', { opacity: 0 })
			.to('.red-screen', { opacity: 1, delay: 3, duration: 0.01 })
			.to('.red-screen', { opacity: 0, duration: 1 })
			.to('.red-screen', { opacity: 0.4, duration: 0.01 })
			.to('.red-screen', { opacity: 0, duration: 1 })
			.to('.red-screen', { opacity: 0.9, duration: 0.05 })
			.to('.red-screen', { opacity: 0.4, duration: 0.1 })
			.to('.red-screen', { opacity: 0.3, duration: 0.3 })
			.to('.red-screen', { opacity: 0.4, duration: 0.1 })
			.to('.red-screen', { opacity: 0, duration: 0.3 })
			.to('.red-screen', { opacity: 0.4, duration: 0.1 })
			.to('.red-screen', { opacity: 0.9, duration: 0.05 })
			.to('.game-dialog', { opacity: 0, duration: 0.1 }, '<')
			.to('.red-screen', { opacity: 0.4, duration: 0.01 })
			.to('.red-screen', { opacity: 0.9, duration: 0.03 })
			.to('.red-screen', { opacity: 0.2, duration: 0.01 })
			.to('.red-screen', { opacity: 0.7, duration: 0.03 })
			.to('.red-screen', { opacity: 0, duration: 0.1 })
			.to('.red-screen', { opacity: 1, duration: 0.1, 'mix-blend-mode': 'normal' });
	}

	function turnOffScreenEffect() {
		void powerCycle(
			() =>
				new Promise<void>((resolve) => {
					resumeFromTurnOff = resolve;
				})
		);
	}

	$effect(() => {
		if (!mounted) return;

		if (isDesktop) {
			observer ??= Observer.create({
				target: window,
				type: 'wheel,touch',
				wheelSpeed: -1,
				tolerance: $isGameMode ? 100 : 10,
				preventDefault: true,
				onUp: () => switchPage(1),
				onDown: () => switchPage(-1)
			});
		} else {
			observer?.kill();
			observer = undefined;
		}

		return () => {
			observer?.kill();
			observer = undefined;
		};
	});

	$effect(() => {
		if (dialogOpen) observer?.disable();
		else observer?.enable();
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

	$effect(() => {
		if ($isGameCleared) {
			observer?.disable();

			setTimeout(() => {
				syncDialogState();
			}, 1000);
		}
	});

	onMount(() => {
		mounted = true;

		document.addEventListener('toggle', syncDialogState, true);

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

		return () => {
			document.removeEventListener('toggle', syncDialogState, true);
			observer?.kill();
		};
	});
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} onkeydown={handleKeyNavigation} />

<div
	class="
		viewport-wrapper
		{$isGameMode && 'game-mode'}
		{showInvertScreen && 'invert-screen'}
		{showMonochromeScreen && 'monochrome-screen'}
	"
>
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
	{#if $isGameMode && isDesktop}
		<ScrollIndicator />
	{:else if !showCombined}
		<Menu />
	{/if}
	{#if $isGameMode}
		{#if showRedScreen}
			<div class="red-screen"></div>
		{:else if showNoiseScreen}
			<div class="noise-screen"></div>
		{:else if showBreakScreen}
			<div class="break-screen" popover="manual" use:underGlass></div>
		{/if}
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
		transition: filter 1s ease;

		@media (max-width: 840px) {
			place-items: start;
			place-content: start;
			overflow: visible;
		}

		&.invert-screen {
			filter: invert(80%);
			transform: scale(-1);
		}

		&.monochrome-screen {
			filter: grayscale(100%);
			transition: filter 5s cubic-bezier(0.53, 0.2, 0.53, 0.2);
		}

		> .red-screen,
		> .noise-screen,
		> .break-screen {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 9999999;
		}

		> .red-screen {
			opacity: 0;
			mix-blend-mode: multiply;
			background: #f00;
		}

		> .noise-screen {
			background-color: #000;
			background-image: url('/src/lib/assets/crt-noise.svg');
			background-size: 75%;
			background-repeat: repeat;
			animation: noiseAnimation 0.1s infinite steps(10);
		}

		> .break-screen {
			margin: 0;
			border: 0;
			overflow: hidden;
			background-color: transparent;
			background-image: url('/src/lib/assets/breaked-screen.png');
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			backdrop-filter: blur(1px);
			z-index: 999999999;

			&::before {
				content: '';
				mix-blend-mode: multiply;
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				opacity: 0.1;
				background-color: #000;
				background-image: url('/src/lib/assets/crt-noise.svg');
				background-size: 75%;
				background-repeat: repeat;
				animation: noiseAnimation 0.1s infinite steps(10);
			}
		}

		@keyframes noiseAnimation {
			0% {
				background-position: 0 0;
			}
			100% {
				background-position: 100% 100%;
			}
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
