<script lang="ts">
	import gsap from 'gsap';
	import { onMount } from 'svelte';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import Icon from '@iconify/svelte';

	import { m } from '$lib/paraglide/messages.js';
	import Avatar from '$lib/components/Avatar.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	let width = $state(0);
	let height = $state(0);

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
			url: 'https://medium.com/@aries0d0f',
			icon: 'fa7-brands:medium'
		},
		{
			name: 'LinkedIn',
			url: 'https://aries0d0f.me/s/linkedin/in',
			icon: 'fa7-brands:linkedin-in'
		}
	];

	function startAnimation() {
		const tl = gsap.timeline();
		tl.set('.intro-content', {
			opacity: 0,
			translateX: -200
		})
			.fromTo(
				'.intro-content',
				width > 700
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
				'<+=2'
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
			);
	}

	onMount(() => {
		startAnimation();
	});
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<div class="viewport-wrapper">
	<main class="intro-container">
		<div class="intro-avatar">
			<Avatar {width} />
		</div>
		<div class="intro-content">
			<article>
				<ParaglideMessage message={m.pages_home_profile_intro} inputs={{}}>
					{#snippet strong({ children })}
						<strong>
							{@render children?.()}
						</strong>
					{/snippet}
				</ParaglideMessage>
			</article>
			<footer>
				<ul class="contact-container">
					{#each contacts as contact (contact.name)}
						<li>
							<a
								href={contact.url}
								target="_blank"
								rel="external noopener noreferrer"
								class="contact"
							>
								<span>{contact.name}</span>
								<Icon class="icon" icon={contact.icon} />
							</a>
						</li>
					{/each}
				</ul>
				<p>
					<LanguageSwitcher />
					&middot;
					<span>&copy; {new Date().getFullYear()} {m.noun_general_name()}</span>
					&middot;
					<a
						href="https://creativecommons.org/licenses/by-sa/4.0/"
						target="_blank"
						rel="external noopener noreferrer"
					>
						<span>CC BY-SA 4.0</span>
					</a>
				</p>
			</footer>
		</div>
	</main>
</div>

<style lang="scss">
	.viewport-wrapper {
		width: 100%;
		min-height: 100vh;
		display: flex;
		place-items: center;
		place-content: center;
		overflow: hidden;
	}

	.intro {
		&-container {
			display: flex;
			place-items: center;
			place-content: center;
			flex-direction: row;
			width: fit-content;
			height: fit-content;

			@media (max-width: 700px) {
				flex-direction: column;
				place-content: start;
				gap: 2rem;

				> .intro-content {
					max-width: 80%;
					padding: 1rem;

					> footer {
						margin-bottom: 0;
						place-items: center;
					}
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

			@media ((max-height: 900px) and (orientation: portrait)) or (max-height: 500px) {
				margin-top: 0;
			}

			z-index: 2;
		}

		&-content {
			display: flex;
			flex-direction: column;
			max-width: 320px;
			line-height: 1.6;
			white-space: pre-wrap;
			gap: 4rem;
			z-index: 1;

			> article {
				font-size: 1rem;
				color: #4d4d4d;
			}

			> footer {
				display: flex;
				width: 100%;
				gap: 1rem;
				margin-bottom: -4.5rem;
				flex-direction: column;
				place-items: end;
				place-content: center;
				padding: 0 1rem;

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

		&:hover {
			filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.25));
		}

		font-size: 28px;

		> span {
			position: absolute;
			background: #000;
			color: #fff;
			padding: 0 0.4rem;
			border-radius: 0.25rem;
			transition: opacity 0.3s ease;
			top: calc(100% + 0.4rem);
			z-index: 1;
			font-size: 0.8125rem;
		}

		&:not(:hover) {
			> span {
				display: none;
			}
		}
	}
</style>
