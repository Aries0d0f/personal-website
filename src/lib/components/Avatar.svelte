<script lang="ts">
	import gsap from 'gsap';
	import { Observer } from 'gsap/Observer';
	import { onMount } from 'svelte';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';

	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { useGameStore } from '$lib/store/game';
	import { useCRT } from '$lib/helpers/crt.svelte';
	import avatarImgNoBg from '$lib/assets/avatar-nbg.png';
	import avatarImgGameMode from '$lib/assets/avatar-nbg-gamemode.png';
	import avatarImgGameModeCreepy from '$lib/assets/avatar-nbg-gamemode-creepy.png';
	import avatarImg from '$lib/assets/avatar.jpg';
	import { Abnormality } from '$lib/game/abnoramlity';
	import { useInteractiveBobble } from '$lib/helpers/interactive-bobble.svelte';
	import Icon from '@iconify/svelte';
	import { useTypewriter } from '$lib/helpers/typewriter.svelte';

	let { width, height, showCombined } = $props<{
		width: number;
		height: number;
		showCombined: boolean;
	}>();

	const { isGameMode, abnormality } = useGameStore();
	const interactiveBobble = useInteractiveBobble(() => $isGameMode || showCombined);
	const bobbleIcon = $derived(interactiveBobble.current?.icon);
	const bobbleLink = $derived(interactiveBobble.current?.link);
	const bobbleText = useTypewriter(() => interactiveBobble.current?.message || '', {
		delayMap: {
			'\b': 1,
			'\f': 300,
			'\n': 30,
			'\t': 500,
			'!': 300
		}
	});
	const showBobble = $derived(bobbleText.current || interactiveBobble.current?.icon);

	const BASE_IMG_WIDTH = 423;

	const avatarImgWidth = $derived(width > BASE_IMG_WIDTH ? BASE_IMG_WIDTH : width);
	const currentLang = $derived(getLocale());

	function startAnimation() {
		const tl = gsap.timeline();
		tl.set('#mask-title-text-clipping-circle', {
			r: 10
		})
			.set('#mask-top-hemisphere-circle', {
				r: 10
			})
			.set('#mask-bottom-hemisphere-circle', {
				r: 0
			})
			.set('#mask-whole-circle', {
				r: 0
			})
			.set('#intro-in-decorate', {
				r: 0,
				opacity: 0
			})
			.fromTo(
				'#intro-in-decorate',
				{
					opacity: 0,
					r: 0,
					cy: -10
				},
				{
					opacity: 1,
					r: 10,
					cy: 320,
					duration: 1,
					ease: 'elastic.out(1, 0.9)'
				},
				'+=0.6'
			)
			.fromTo(
				'#intro-in-decorate',
				{
					r: 10,
					opacity: 1
				},
				{
					r: 160,
					opacity: 0,
					duration: 0.5,
					ease: 'elastic.out(1, 0.9)'
				}
			)
			.fromTo(
				'#mask-title-text-clipping-circle',
				{
					r: 10
				},
				{
					r: 150,
					duration: 0.5,
					ease: 'elastic.out(1, 0.9)'
				},
				'<'
			)
			.fromTo(
				'#mask-top-hemisphere-circle',
				{
					r: 0
				},
				{
					r: 150,
					duration: 0.5,
					ease: 'elastic.out(1, 0.9)'
				},
				'<'
			)
			.fromTo(
				'#mask-bottom-hemisphere-circle',
				{
					r: 0
				},
				{
					r: 150,
					duration: 0.5,
					ease: 'elastic.out(1, 0.9)'
				},
				'<'
			)
			.fromTo(
				'#mask-bottom-hemisphere-rect',
				{
					scale: 0,
					y: 10,
					rx: 100,
					transformOrigin: 'bottom center'
				},
				{
					scale: 150 / 160,
					y: 0,
					rx: 0,
					duration: 0.5,
					ease: 'elastic.out(1, 0.9)'
				},
				'<'
			)
			.fromTo(
				'#mask-title-text-clipping-circle',
				{
					r: 150
				},
				{
					r: 160,
					duration: 0.1,
					ease: 'none'
				},
				'<+=0.5'
			)
			.fromTo(
				'#mask-bottom-hemisphere-group',
				{
					opacity: 0
				},
				{
					opacity: 1,
					duration: 0.1,
					ease: 'none'
				},
				'<'
			)
			.fromTo(
				'#mask-top-hemisphere-circle',
				{
					r: 150
				},
				{
					r: 160,
					duration: 0.1,
					ease: 'none'
				},
				'<'
			)
			.fromTo(
				'#mask-bottom-hemisphere-circle',
				{
					r: 150
				},
				{
					r: 160,
					duration: 0.1,
					ease: 'none'
				},
				'<'
			);
	}

	function switchGameModeAvatar(skipTransition = false, creepyMode = false) {
		if (skipTransition) {
			gsap.set('#image-source-no-bg', {
				attr: { 'xlink:href': creepyMode ? avatarImgGameModeCreepy : avatarImgGameMode }
			});
			return;
		}

		const tl = gsap.timeline();
		tl.to('#image-source-no-bg', {
			attr: { 'xlink:href': creepyMode ? avatarImgGameModeCreepy : avatarImgGameMode },
			duration: 0.3,
			ease: 'power3.out',
			delay: 0.36
		})
			.to('#image-source-no-bg', {
				attr: { 'xlink:href': avatarImgNoBg },
				duration: 0.5,
				ease: 'power3.out'
			})
			.to('#image-source-no-bg', {
				attr: { 'xlink:href': creepyMode ? avatarImgGameModeCreepy : avatarImgGameMode },
				duration: 0.5,
				ease: 'power3.out',
				delay: 0.36
			});
	}

	const crt = useCRT();

	$effect(() => {
		if (crt.isRunning) {
			switchGameModeAvatar();
		}

		if ($isGameMode) {
			if ($abnormality === Abnormality.AN14) {
				switchGameModeAvatar(true, true);
			} else {
				switchGameModeAvatar(true, false);
			}
		}
	});

	onMount(() => {
		startAnimation();
		gsap.registerPlugin(Observer);
		Observer.create({
			target: window,
			type: 'pointer',
			onMove: (pointer) => {
				const { x, y } = pointer;
				const offsetX = ((x ?? 0) - width / 2) / width;
				const offsetY = ((y ?? 0) - height / 2) / height;
				gsap.to(
					['#morphing-image', '#morphing-group', '#mask-bottom-hemisphere-group', '#bobble'],
					{
						translateX: offsetX * 10,
						translateY: offsetY * 10
					}
				);
			}
		});
	});
</script>

{#snippet avatar()}
	<svg
		class="avatar-instance"
		width={avatarImgWidth}
		height="531"
		viewBox="0 0 {avatarImgWidth} 531"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
	>
		<g transform="translate({(avatarImgWidth - BASE_IMG_WIDTH) / 2}, 0)">
			<g>
				<g mask="url(#mask-bottom-hemisphere)">
					<g mask="url(#mask-top-hemisphere)">
						<g id="morphing-image">
							<rect
								x="46.0884"
								y="-1"
								width="330"
								height="489.766"
								fill="url(#pattern-image-source)"
							/>
							<rect
								x="51.0884"
								y="4"
								width="320"
								height="479.766"
								fill="url(#pattern-image-source)"
							/>
						</g>
					</g>
					<g id="morphing-group" transform="translate(0, 0)" transform-origin="center">
						<g filter="url(#filter-soften-boundary)" style="mix-blend-mode:darken">
							<rect
								x="51.0884"
								y="4"
								width="320"
								height="479.766"
								fill="url(#pattern-image-no-bg)"
							/>
						</g>
						<rect x="51.0884" y="4" width="320" height="479.766" fill="url(#pattern-image-no-bg)" />
					</g>
				</g>
			</g>
			<path id="avatar-slogan-text-path" fill="#none" d="M 26,320 A 185,185 0 0,0 396,320" />
			<text>
				<textPath
					id="avatar-slogan-text"
					href="#avatar-slogan-text-path"
					startOffset={width >= 320 ? '49%' : '35.75%'}
					text-anchor="left"
				>
					{#if $isGameMode && $abnormality === Abnormality.AN15}
						{m.game_components_avatar_slogan_creepy()}
					{:else if $isGameMode}
						{m.game_components_avatar_slogan()}
					{:else}
						{m.components_avatar_slogan()}
					{/if}
				</textPath>
			</text>
			<circle
				id="intro-in-decorate"
				cx="211.088"
				cy="320"
				r="0"
				fill="var(--accent-fill)"
				opacity="0"
			/>
		</g>
		<defs>
			<mask
				id="mask-whole"
				style="mask-type:alpha"
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="423"
				height="531"
			>
				<circle id="mask-whole-circle" cx="211.088" cy="320" r="10000" fill="#000" />
			</mask>
			<mask
				id="mask-top-hemisphere"
				style="mask-type:alpha"
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="423"
				height="531"
			>
				<circle id="mask-top-hemisphere-circle" cx="211.088" cy="320" r="160" fill="#000" />
			</mask>
			<mask
				id="mask-bottom-hemisphere"
				style="mask-type:alpha"
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="423"
				height="531"
			>
				<circle id="mask-bottom-hemisphere-circle" cx="211.088" cy="320" r="160" fill="#000" />
				<rect
					id="mask-bottom-hemisphere-rect"
					x="51.088"
					y="0"
					width="320"
					height="320"
					fill="#fff"
				/>
				<g id="mask-bottom-hemisphere-group">
					<path
						d="M347.588 300L347.588 300L349.088 400.5L334.088 427L253.088 478L239.588 466L247.588 400Z"
						fill="#fff"
					/>
				</g>
			</mask>
			<mask
				id="mask-title-text-clipping"
				maskUnits="userSpaceOnUse"
				style="mask-type:alpha"
				x={(avatarImgWidth - BASE_IMG_WIDTH) / 2}
				y="0"
				width="423"
				height="531"
			>
				<circle
					id="mask-title-text-clipping-circle"
					cx={211.088 + (avatarImgWidth - BASE_IMG_WIDTH) / 2}
					cy="320"
					r="160"
					fill="#fff"
				/>
			</mask>
			<pattern
				id="pattern-image-source"
				patternContentUnits="objectBoundingBox"
				width="1"
				height="1"
			>
				<use xlink:href="#image-source" transform="scale(0.000366032 0.000244141)" />
			</pattern>
			<pattern
				id="pattern-image-no-bg"
				patternContentUnits="objectBoundingBox"
				width="1"
				height="1"
			>
				<use xlink:href="#image-source-no-bg" transform="scale(0.000366032 0.000244141)" />
			</pattern>
			<filter
				id="filter-soften-boundary"
				x="49.0884"
				y="2"
				width="324"
				height="483.766"
				filterUnits="userSpaceOnUse"
				color-interpolation-filters="sRGB"
			>
				<feFlood flood-opacity="0" result="BackgroundImageFix" />
				<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur stdDeviation="1" result="softenBoundaryImage" />
			</filter>
			<image
				id="image-source"
				width="2732"
				height="4096"
				preserveAspectRatio="none"
				xlink:href={avatarImg}
			/>
			<image
				id="image-source-no-bg"
				width="2732"
				height="4096"
				preserveAspectRatio="none"
				xlink:href={$isGameMode ? avatarImgGameMode : avatarImgNoBg}
			/>
		</defs>
	</svg>
{/snippet}

{#snippet title(visualOnly = false)}
	<svelte:element this={visualOnly ? 'div' : 'header'} class={visualOnly ? 'visual-only' : ''}>
		<h1 lang={currentLang}>
			<ParaglideMessage
				message={$isGameMode ? m.game_components_avatar_title : m.components_avatar_title}
				inputs={{
					name: m.noun_general_name()
				}}
			>
				{#snippet span({ children })}
					<span>
						{@render children?.()}
					</span>
				{/snippet}
				{#snippet strong({ children })}
					<strong data-bobble-msg={m.hover_bobble_avatar_name({ name: m.noun_general_name() })}>
						{@render children?.()}
					</strong>
				{/snippet}
			</ParaglideMessage>
		</h1>
	</svelte:element>
{/snippet}

{#snippet bobble()}
	{#if showBobble}
		<div id="bobble" class="bobble-container">
			<svelte:element
				this={bobbleLink ? 'a' : 'div'}
				class="bobble-instance {(bobbleText.current === '' && bobbleIcon) ||
				(bobbleText.current.length === 1 && !bobbleIcon)
					? 'circle'
					: ''}"
				href={bobbleLink}
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Bobble Message"
			>
				{#if bobbleIcon}
					<Icon class="icon" icon={bobbleIcon} />
				{/if}
				{#if bobbleText.current}
					<p class="bobble">{bobbleText.current}</p>
				{/if}
			</svelte:element>
		</div>
	{:else}
		<!-- <div id="bobble" class="bobble-container">
			<p class="bobble">TEST</p>
		</div> -->
	{/if}
{/snippet}

<div class="avatar-container">
	{@render title()}
	{#if browser}
		{@render title(true)}
	{/if}
	{@render avatar()}
	{@render bobble()}
</div>

<style lang="scss">
	.bobble {
		&-container {
			position: absolute;
			bottom: 72.5%;
			right: 60%;

		}

		&-instance {
			display: flex;
			flex-direction: row;
			place-items: center;
			gap: 0.5rem;
			width: fit-content;
			height: fit-content;
			border-radius: 1.2rem;
			padding: 0.5rem 1rem;
			background-color: #fff;
			box-shadow:
				inset 0 0 1px 0 rgba(0, 0, 0, 0.1),
				inset 1px -1px 2px 1px rgba(130, 130, 255, 0.1),
				0 0px 7px rgba(0, 0, 0, 0.1);
			animation: bobble-fade-in 0.3s cubic-bezier(0.25, 0.46, 0.05, 1.44) forwards;
			color: inherit;
			text-decoration: none;
			margin-left: -2rem;

			&.circle {
				padding: 0.5rem;
				width: fit-content;
				height: fit-content;
			}

			> * {
				pointer-events: none;
			}

			white-space: pre;

			&::before {
				content: '';
				position: absolute;
				bottom: -0.25rem;
				right: -0.75rem;
				border-radius: 50%;
				width: 0.75rem;
				height: 0.75rem;
				background-color: #fff;
				box-shadow:
					inset 0 0 1px 0 rgba(0, 0, 0, 0.1),
					inset 1px -1px 2px 1px rgba(130, 130, 255, 0.1),
					0 0px 7px rgba(0, 0, 0, 0.1);
			}
		}

		@keyframes bobble-fade-in {
			0% {
				opacity: 0;
				transform: translate(100%, 100%) scale(0);
			}
			100% {
				opacity: 1;
				transform: translate(0, 0) scale(1);
			}
		}
	}

	.avatar-container {
		position: relative;
		width: fit-content;
		height: fit-content;
		display: flex;
		max-width: 100%;

		> svg {
			width: 100%;
			height: 100%;

			text {
				font-size: 1.25rem;
				font-weight: 500;
				fill: #000;
			}
		}

		> header,
		> .visual-only {
			position: absolute;
			display: flex;
			place-items: center;
			width: 100%;
			height: 100%;
			color: #000;

			> h1 {
				position: absolute;
				display: inline-flex;
				flex-direction: column;
				gap: 0;
				font-size: 1.5rem;
				font-weight: 500;
				text-align: left;
				white-space: pre;
				line-height: 0.8;
				margin: 0;
				bottom: 17.5%;
				left: 4%;

				&[lang='zh-tw'] {
					line-height: 1;
					margin-bottom: -0.75rem;
				}

				&[lang='ja'] {
					line-height: 1.1;
					margin-bottom: -0.5rem;
				}

				> span {
					z-index: 2;
				}

				> strong {
					font-weight: 700;
					font-size: 4rem;
					margin-top: 0.25rem;
				}
			}
		}

		> .visual-only {
			color: #fff;
			mask-image: url('#mask-title-text-clipping');
			pointer-events: none;
			z-index: 3;

			::selection {
				background: none !important;
				fill: unset !important;
				color: unset !important;
			}
		}
	}
</style>
