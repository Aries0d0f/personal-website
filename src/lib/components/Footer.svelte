<script lang="ts">
	import Icon from '@iconify/svelte';

	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	let { sideMode, mobile }: { sideMode?: boolean; mobile?: boolean } = $props();

	const contacts = [
		{
			name: 'Email',
			url: 'mailto:aries0d0f@gmail.com',
			icon: 'fa7-solid:envelope'
		},
		{
			name: 'GitHub',
			url: 'https://aries0d0f.me/s/github',
			icon: 'fa7-brands:github'
		},
		{
			name: 'Telegram',
			url: 'https://aries0d0f.me/s/t.me',
			icon: 'fa7-brands:telegram'
		},
		{
			name: 'Medium',
			url: 'https://aries0d0f.me/s/@medium',
			icon: 'fa7-brands:medium'
		},
		{
			name: 'LinkedIn',
			url: 'https://aries0d0f.me/s/linkedin/in',
			icon: 'fa7-brands:linkedin-in'
		}
	];
</script>

<footer class:side={sideMode} class:mobile>
	<ul class="contact-container">
		{#each contacts as contact (contact.name)}
			<li>
				<a href={contact.url} target="_blank" rel="external noopener noreferrer" class="contact">
					<span>{contact.name}</span>
					<Icon class="icon" icon={contact.icon} />
				</a>
			</li>
		{/each}
	</ul>
	<p>
		{#if sideMode}
			<LanguageSwitcher />
		{/if}
		{#if mobile}
			<LanguageSwitcher mobile />
			&middot;
		{/if}
		<span>&copy; {new Date().getFullYear()} Aries Cs</span>
		{#if !sideMode}
			&middot;
			<a
				href="https://github.com/Aries0d0f/personal-website/blob/main/LICENSE"
				target="_blank"
				rel="external noopener noreferrer"
			>
				<span>CC BY-SA 4.0</span>
			</a>
		{/if}
	</p>
</footer>

<style lang="scss">
	footer {
		display: flex;
		width: 100%;
		gap: 1rem;
		margin-bottom: -4.5rem;
		flex-direction: column;
		place-content: center;

		&.mobile {
			padding-bottom: 2.5rem;
		}

		p {
			display: flex;
			gap: 0.25rem;
			place-items: center;

			&,
			> * {
				color: #4d4d4d;
				text-align: right;
				font-size: 0.825rem;
			}

			> * {
				white-space: nowrap;
			}
		}

		@media (max-width: 700px) {
			margin-bottom: 0;
			place-items: center;
		}

		@media (max-width: 414px) {
			white-space: nowrap;
		}

		&.side {
			gap: 1rem;
			flex-direction: row;
			position: absolute;
			left: 0;
			top: 0;
			place-content: space-between;
			place-items: center;
			height: 100%;
			width: 36px;
			padding: 1rem 0;

			.contact {
				&-container {
					gap: 0.5rem;
				}

				font-size: 18px;
				flex-direction: row-reverse;

				&:not(:hover) {
					color: #aaa;
				}

				> span {
					top: unset;
					right: calc(100% + 0.5rem);
					writing-mode: horizontal-tb;
				}

				@media (max-height: 680px) and (orientation: landscape) {
					display: none;
				}
			}
		}
	}

	.contact {
		&-container {
			display: flex;
			gap: 1.6rem;
			list-style: none;
			place-content: center;
			place-items: center;
			width: fit-content;

			@media (max-width: 300px) {
				gap: 1rem;
			}

			> li {
				display: inline-flex;
			}
		}

		color: #000;
		transition: color 0.3s ease;
		position: relative;
		text-decoration: none;
		display: inline-flex;
		place-content: center;
		font-size: 28px;

		&:hover {
			filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.25));
		}

		> span {
			position: absolute;
			background: #000;
			color: #fff;
			padding: 0 0.4rem;
			border-radius: 0.25rem;
			transition: opacity 0.3s ease;
			top: calc(100% + 0.4rem);
			z-index: 10;
			font-size: 0.8125rem;

			&::selection {
				background: none !important;
				color: unset !important;
			}
		}

		&:not(:hover) {
			> span {
				display: none;
			}
		}
	}
</style>
