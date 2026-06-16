<script lang="ts">
	let { data, children } = $props();
</script>

<article class="timeline-container">
	<h1>{data.metadata?.title}</h1>
	{@render children?.()}

	<style lang="scss">
		section {
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
				gap: 0.4rem;
				margin-top: -0.75rem;
				line-height: 1.4;

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
		}
	</style>
</article>

<style lang="scss">
	.timeline-container {
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
</style>
