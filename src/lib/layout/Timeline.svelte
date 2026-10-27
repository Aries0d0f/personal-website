<script lang="ts">
	import { reveal } from '#lib/helpers/reveal.js';

	let { data, children } = $props();
</script>

<article class="timeline-container">
	<h1>{data.metadata?.title}</h1>
	<div class="timeline-content" use:reveal>
		{@render children?.()}
	</div>
</article>

<style lang="scss">
	:global {
		.timeline-content {
			> section {
				position: relative;
				display: flex;
				flex-direction: column;
				gap: 0.5rem;
				margin-top: 0.5rem;

				@media (max-width: 414px) {
					padding-left: 1rem;
				}

				&::before {
					content: '';
					display: block;
					width: 2px;
					height: calc(100% + 1.5rem);
					background-color: #ccc;
					position: absolute;
					left: -1rem;
					top: 0;

					@media (max-width: 414px) {
						left: 0;
					}
				}

				&:last-of-type::before {
					height: 100%;
				}

				> hgroup {
					display: flex;
					flex-direction: column;
					gap: 0.1rem;
					margin-top: -0.625rem;
					line-height: 1.4;

					&:has(:nth-child(3)) {
						gap: 0.5rem;
						margin-bottom: 0.5rem;

						> :nth-child(3) {
							margin-top: 0.2rem;
						}
					}

					h2 {
						font-size: 1rem;
						font-weight: 600;
						line-height: 1.2;
					}

					strong {
						font-size: 0.875rem;
						font-weight: 500;
					}

					em {
						display: inline-flex;
						font-size: 0.75rem;
						place-items: center;
					}

					s {
						text-decoration: none;
						position: relative;

						&::before {
							pointer-events: none;
							position: absolute;
							z-index: -1;
							left: 0;
							top: 0;
							content: '';
							display: block;
							width: 100%;
							height: 100%;
							background-color: #000;
							transform: scale3d(0, 1, 1);
							transform-origin: left;
							position: absolute;
							left: 0;
							bottom: 50%;
						}
					}

					p:has(:only-child) {
						line-height: 1;
					}

					> :first-child {
						&::before {
							content: '';
							display: block;
							width: 8px;
							height: 8px;
							background-color: #ccc;
							border-radius: 50%;
							position: absolute;
							left: calc(-1rem - 4px + 1px);
							top: -4px;

							@media (max-width: 414px) {
								left: calc(-4px + 1px);
							}
						}
					}

					@media (max-height: 720px) and (orientation: landscape) {
						line-height: 1;
					}
				}

				> p {
					font-size: 0.8125rem;
					color: #4d4d4d;
				}

				&.reveal {
					opacity: 0;
					transform: translate3d(0, 10px, 0);
					will-change: opacity, transform;
				}

				&.revealed {
					animation: fadeInUp 0.5s ease forwards;

					> hgroup s::before {
						animation: strikeThrough 0.5s ease forwards;
					}
				}

				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translate3d(0, 10px, 0);
					}
					to {
						opacity: 1;
						transform: translate3d(0, 0, 0);
					}
				}

				@keyframes strikeThrough {
					from {
						transform: scale3d(0, 1, 1);
					}
					to {
						transform: scale3d(1, 1, 1);
					}
				}
			}
		}
	}

	.timeline-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;

		> h1 {
			line-height: 1.2;
			font-size: 2rem;
			font-weight: 600;
			color: #000;

			@media (max-height: 720px) and (orientation: landscape) {
				line-height: 1.2;
				font-size: 1.5rem;
			}
		}
	}
</style>
