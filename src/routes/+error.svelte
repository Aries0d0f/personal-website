<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const currentLang = $derived(getLocale());
	const headTitle = $derived([page.status, page.error?.message].filter(Boolean).join(' '));
	const title = $derived(
		page.status === 404
			? m.pages_error_404_title()
			: page.status >= 500
				? m.pages_error_5xx_title()
				: m.pages_error_general_title()
	);
	const description = $derived.by(() => {
		const messages = (
			page.status === 404 ? m.pages_error_404_description() : m.pages_error_general_description()
		)
			.split('|')
			.map((s) => s.trim());
		return messages[Math.floor(Math.random() * messages.length)];
	});
</script>

<svelte:head>
	<title>{headTitle} | {m.noun_general_name()}</title>
</svelte:head>

<div class="error-container">
	<div class="error-wrapper">
		<img src="/avatar.gif" alt="Avatar" />
		<article>
			<h1>{page.status}</h1>
			<h2>{title}</h2>
			<p>{description}</p>
		</article>
	</div>
	<a href="/{currentLang}" rel="external">
		<svg
			class="deco-vertical"
			width="10"
			height="147"
			viewBox="0 0 10 147"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M0.5 145.629V144.629M0.5 135.629L0.500488 0.129395L9.47679 33.6294"
				stroke="white"
				stroke-linecap="round"
			/>
		</svg>

		<svg
			class="deco-horizontal"
			width="93"
			height="10"
			viewBox="0 0 93 10"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M92.3911 9.47656L91.3911 9.47656M82.3911 9.47656L0.129395 9.47654L33.6294 0.50024"
				stroke="white"
				stroke-linecap="round"
			/>
		</svg>

		{m.pages_error_back_to_home()}
	</a>
</div>

<style lang="scss">
	:global {
		body:has(.error-container) {
			background-color: #000;
		}
	}

	.error {
		&-container {
			display: flex;
			place-items: center;
			place-content: center;
			width: 100%;
			min-height: 100dvh;
			background-color: #000;
			color: #fff;
			gap: 4rem;

			> a {
				display: flex;
				flex-direction: row;
				place-items: center;
				place-content: center;
				gap: 1rem;
				color: #fff;
				text-decoration: none;
				writing-mode: vertical-rl;
				text-orientation: mixed;
				font-size: 0.8125rem;
				padding: 2rem;
				position: absolute;
				opacity: 0.75;
				right: 0;
				white-space: nowrap;
				transition:
					gap 0.3s cubic-bezier(0.4, 0, 0.2, 1.9),
					opacity 0.3s ease;

				&:hover {
					gap: 2rem;
					opacity: 1;
				}

				> .deco-horizontal {
					display: none;
				}
			}

			@media (max-width: 700px) {
				flex-direction: column;
				gap: 0rem;

				> a {
					writing-mode: horizontal-tb;
					text-orientation: initial;
					position: relative;

					> .deco-vertical {
						display: none;
					}

					> .deco-horizontal {
						display: block;
					}
				}
			}

			@media (max-width: 375px) {
				height: 100%;
				overflow: hidden;
			}
		}

		&-wrapper {
			display: flex;
			flex-direction: row;
			place-items: center;
			place-content: center;
			gap: 2rem;
			padding: 2rem;

			> img {
				filter: brightness(150%);
				height: 16rem;
				width: 16rem;
			}

			article {
				display: flex;
				flex-direction: column;
				gap: 1rem;
				line-height: 1;
				border-left: 1px solid rgba(255, 255, 255, 0.2);
				padding: 0 4rem;

				h1 {
					font-size: 8rem;
					font-weight: 500;
					font-variant-numeric: tabular-nums;
				}

				h2 {
					font-size: 2rem;
					font-weight: 500;
				}

				p {
					line-height: 1.6;
					font-size: 1.2rem;
					margin-bottom: 2rem;
				}
			}

			@media (max-width: 700px) {
				flex-direction: column;
				gap: 0rem;

				> article {
					text-align: center;
					border: none;
					padding: 0;

					> h2 {
						font-size: 1.8rem;
					}

					> p {
						font-size: 0.9rem;
						margin-bottom: 0;
					}
				}
			}

			@media (max-width: 375px) {
				padding: 0rem 1rem;

				> img {
					height: 12rem;
					width: 12rem;
				}
			}
		}
	}
</style>
