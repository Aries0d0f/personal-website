<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { getLocale } from '$lib/paraglide/runtime';

    let { data } = $props();

    onMount(() => {
        if (!data?.game?.active) {
            goto(resolve(`/${getLocale()}`));
        }
    });
</script>