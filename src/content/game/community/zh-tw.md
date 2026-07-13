---
title: 社群參與及貢獻
layout: timeline
---

<script lang="ts">
  import { Abnormality } from '$lib/game/abnoramlity';
  import { useGlitch } from '$lib/helpers/glitch.svelte';

  let { currentAbnormality }: { currentAbnormality: Abnormality } = $props();

  const hitconTitle = useGlitch(() => `HITCON 2020`, () => currentAbnormality !== Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
  const hitconSubtitle = useGlitch(() => `臺灣駭客年會`, () => currentAbnormality !== Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
  const hitconDescription = useGlitch(() => `系統開發組組員`, () => currentAbnormality !== Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
</script>

<section>
<hgroup>

{#if currentAbnormality === Abnormality.AN06}

## 臺灣<s>光明會</s>支部

{:else}

## WIKIDATA Taiwan

{/if}

</hgroup>

社群共同創辦人

</section>

{#if currentAbnormality === Abnormality.AN08}

{#each Array(4) as dumb, index (index) }

<section>
<hgroup>

## HITCON 2020

_臺灣駭客年會_

</hgroup>

系統開發組組員

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

_學生計算機年會_

</hgroup>

開發組組長

</section>

{#if currentAbnormality === Abnormality.AN09}

<section>
<hgroup>

## 回頭

</hgroup>

快回頭

</section>

<section>
<hgroup>

## 快回頭

</hgroup>

回頭回頭回頭回頭回頭回頭回頭回頭回頭回頭回頭

</section>

{:else}

<section>
<hgroup>

## SITCON Camp 2017

_學生計算機年會夏令營_

</hgroup>

課程活動組組員兼文創組組員

</section>

<section>
<hgroup>

## Opass

</hgroup>

專案貢獻者

</section>
{/if}
{/if}
