<script lang="ts">
	import gsap from 'gsap';
	import { onMount } from 'svelte';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';

	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import avatarImgNoBg from '$lib/assets/avatar-nbg.png';
	import avatarImg from '$lib/assets/avatar.jpg';

	let { width } = $props<{
		width: number;
	}>();

	const BASE_IMG_WIDTH = 423;

	const avatarImgWidth = $derived(width > BASE_IMG_WIDTH ? BASE_IMG_WIDTH : width);

	function startAnimation() {
		const tl = gsap.timeline();
		tl.set('#mask-title-text-clipping-circle', {
			r: 10
		})
			.set('#mask-top-hemisphere-circle', {
				r: 10
			})
			.set('#mask-bottom-hemisphere-circle', {
				r: 10
			})
			.set('#mask-whole-circle', {
				r: 0
			})
			.set('#intro-in-circle', {
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
				'#mask-bottom-hemisphere-circle',
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
				'#mask-whole-circle',
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
			)
			.fromTo(
				'#mask-whole-circle',
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
				'#mask-whole-circle',
				{
					r: 160
				},
				{
					r: 1000,
					duration: 8,
					ease: 'elastic.out(1, 0.7)'
				},
				'<+=0.1'
			);
	}

	onMount(() => {
		startAnimation();
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
			<g mask="url(#mask-whole)">
				<g mask="url(#mask-bottom-hemisphere)">
					<g mask="url(#mask-top-hemisphere)">
						<rect
							x="51.0884"
							y="4"
							width="320"
							height="479.766"
							fill="url(#pattern-image-source)"
						/>
					</g>
					<g filter="url(#filter-soften-boundary)" style="mix-blend-mode:darken">
						<rect x="51.0884" y="4" width="320" height="479.766" fill="url(#pattern-image-no-bg)" />
					</g>
					<rect x="51.0884" y="4" width="320" height="479.766" fill="url(#pattern-image-no-bg)" />
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
					{m.components_avatar_slogan()}
				</textPath>
			</text>
			<circle id="intro-in-decorate" cx="211.088" cy="320" r="0" fill="#000" opacity="0" />
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
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M51.0884 0H371.088V320C371.088 351.984 361.704 381.775 345.538 406.772L334.088 427L324.028 433.335C307.338 449.967 286.995 462.937 264.308 470.936L253.088 478L249.983 475.24C237.532 478.349 224.503 480 211.088 480C122.723 480 51.0884 408.366 51.0884 320V0Z"
					fill="#fff"
				/>
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
				xlink:href={avatarImgNoBg}
			/>
		</defs>
	</svg>
{/snippet}

{#snippet title(visualOnly = false)}
	<svelte:element this={visualOnly ? 'div' : 'header'} class={visualOnly ? 'visual-only' : ''}>
		<h1 lang={getLocale()}>
			<ParaglideMessage
				message={m.components_avatar_title}
				inputs={{
					name: m.noun_general_name()
				}}
			>
				{#snippet strong({ children })}
					<strong>
						{@render children?.()}
					</strong>
				{/snippet}
			</ParaglideMessage>
		</h1>
	</svelte:element>
{/snippet}

<div class="avatar-container">
	{@render title()}
	{#if browser}
		{@render title(true)}
	{/if}
	{@render avatar()}
</div>

<style lang="scss">
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

			&::selection {
				background: none;
			}
		}
	}
</style>
