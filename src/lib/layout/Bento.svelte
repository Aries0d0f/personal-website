<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';

	let { data, children } = $props();

	const currentLang = $derived(getLocale());
</script>

<article class="bento-container">
	<h1>{data.metadata?.title}</h1>
	<div class="bento-wrapper" lang={currentLang}>
		{@render children?.()}
	</div>

	<style lang="scss">
		.bento-wrapper {
			> section {
				display: flex;
				flex-direction: column;
				flex: 0.5 calc((100% - 0.5rem) / 2);
				padding: 0.3rem 0.5rem;
				gap: 0.2rem;
				background-color: #f9f9f9;
				border-radius: 4px;

				&[size='full'] {
					flex: 1 100%;
				}

				@media (width < 320px) {
					flex: 1 100%;
				}

				@media (max-height: 720px) and (width > 840px) {
					padding: 0.1rem 0.3rem;
					gap: 0.1rem;

					> h2 {
						font-size: 0.7rem;
						line-height: 1;
					}

					> p {
						&:first-of-type,
						&:only-of-type {
							font-size: 0.8rem;
						}
					}
				}

				> h2 {
					font-size: 0.9rem;
					font-weight: 500;
					width: 100%;
					margin-bottom: 0.125rem;
					line-height: 1.1;
					color: #777;
				}

				> p {
					line-height: 1.4;

					&:first-of-type,
					&:only-of-type {
						font-size: 0.9rem;
						font-weight: 600;
					}

					&:last-of-type:not(:only-of-type) {
						font-size: 0.75rem;
						color: #4d4d4d;
					}
				}

				&:not([size='full']) {
					> p:only-of-type {
						font-size: 0.75rem;
						font-weight: 400;
						color: #4d4d4d;
					}
				}

				@for $i from 1 through 10 {
					animation-delay: 0.5s;
					animation: fadeInUp 0.5s ease forwards;
					opacity: 0;
					transform: translateY(10px);

					&:nth-of-type(#{$i}) {
						animation-delay: ($i - 1) * 0.05s;
					}
				}
			}

			&[lang='ja'] {
				> section {
					> h2 {
						line-height: 1.4;
						font-family:
							'Kosugi Maru',
							'Huninn',
							-apple-system,
							BlinkMacSystemFont,
							'Segoe UI',
							Roboto,
							Oxygen,
							Ubuntu,
							Cantarell,
							'Open Sans',
							'Helvetica Neue',
							sans-serif;
					}
				}
			}
		}

		@keyframes fadeInUp {
			from {
				opacity: 0;
				transform: translateY(10px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	</style>
</article>

<style lang="scss">
	.bento {
		&-container {
			display: flex;
			flex-direction: column;
			gap: 1rem;

			@media (max-height: 720px) and (width > 840px) {
				gap: 0.75rem;
			}

			> h1 {
				font-size: 2rem;
				font-weight: 600;
				color: #000;

				@media (max-height: 720px) and (orientation: landscape) {
					line-height: 1.2;
					font-size: 1.5rem;
				}
			}
		}

		&-wrapper {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>
