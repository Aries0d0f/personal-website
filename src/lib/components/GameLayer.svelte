<script lang="ts">
	import { onMount } from 'svelte';
	import { useNavigationLock } from '#lib/helpers/navigation-lock.svelte.js';
	import { useGameStore } from '#lib/store/game.js';
	import GameOptions from './GameOptions.svelte';
	import GameClear from './GameClear.svelte';

	const { isGameMode, isGameCleared } = useGameStore();

	// No escaping the game through the browser chrome.
	useNavigationLock(() => $isGameMode);

	// Reset game scratch data.
	onMount(() => sessionStorage.clear());
</script>

{#if $isGameMode}
	<GameOptions />
{/if}
{#if $isGameCleared}
	<GameClear />
{/if}
