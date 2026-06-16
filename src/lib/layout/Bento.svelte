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

				> h2 {
					font-size: 0.9rem;
					width: 100%;
					margin-bottom: 0.125rem;
					line-height: 1.1;
				}

				> p {
					line-height: 1.4;

					&:first-of-type,
					&:only-of-type {
						font-size: 1rem;
						font-weight: 500;
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
	</style>
</article>

<style lang="scss">
	.bento {
		&-container {
			display: flex;
			flex-direction: column;
			gap: 1.5rem;

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
