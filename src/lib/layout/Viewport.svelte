<script lang="ts">
	import gsap from 'gsap';
	import { onMount } from 'svelte';

	import Avatar from '$lib/components/Avatar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Menu from '$lib/components/Menu.svelte';

	let { children } = $props();

	let width = $state(0);
	let height = $state(0);

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
			<Avatar {width} {height} />
		</div>
		<div class="intro-content" style="opacity: 0">
			{@render children()}

			<Footer />
		</div>
	</main>
	<Menu />
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

			@media (max-width: 800px) {
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

			@media ((max-height: 900px) and (orientation: portrait)) or (max-height: 500px) {
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

			@media (min-width: 800px) {
				width: 340px;
			}
		}
	}
</style>
