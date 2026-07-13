---
title: Contribution & Community Attendance
layout: timeline
---

<script lang="ts">
  import { Abnormality } from '$lib/game/abnoramlity';
  import { useGlitch } from '$lib/helpers/glitch.svelte';

  let { currentAbnormality }: { currentAbnormality: Abnormality } = $props();

  const hitconTitle = useGlitch(() => `HITCON 2020`, () => currentAbnormality === Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
  const hitconSubtitle = useGlitch(() => `Hacks in Taiwan Conference`, () => currentAbnormality === Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
  const hitconDescription = useGlitch(() => `System Development Team Member`, () => currentAbnormality === Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
</script>

<section>

<hgroup>

{#if currentAbnormality === Abnormality.AN06}

## <s>Illuminati</s> Taiwan

{:else}

## WIKIDATA Taiwan

{/if}

</hgroup>

Community Co-founder

</section>

{#if currentAbnormality === Abnormality.AN08}

{#each Array(4) as dumb, index (index) }

<section>
<hgroup>

## HITCON 2020

_Hacks in Taiwan Conference_

</hgroup>

System Development Team Member

</section>
<wbr />
{/each}

{:else}

<section>
<hgroup>

## {hitconTitle.current}

_{hitconSubtitle.current}_

</hgroup>

{hitconDescription.current}

</section>

<section>
<hgroup>

## SITCON 2019, 2020

_Students’ Information Technology Conference_

</hgroup>

Development Team Leader

</section>

{#if currentAbnormality === Abnormality.AN09}

<section>
<hgroup>

## Go Back

</hgroup>

Go back

</section>

<section>
<hgroup>

## Go Back

</hgroup>

Go back go back go back go back go back go back go back

</section>

{:else}

<section>
<hgroup>

## SITCON Camp 2017

_Students’ Information Technology Conferenc - Summer Camp_

</hgroup>

Course Activity Team & Cultural and Creative Team Member

</section>

<section>
<hgroup>

## Opass

</hgroup>

Project Contributor

</section>

{/if}
{/if}
