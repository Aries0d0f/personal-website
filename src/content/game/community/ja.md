---
title: コミュニティ活動
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
  const hitconSubtitle = useGlitch(() => `Hacks in Taiwan Conference`, () => currentAbnormality !== Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
  const hitconDescription = useGlitch(() => `システム開発チームメンバー`, () => currentAbnormality !== Abnormality.AN07, {
    maxIntensity: 1,
    depth: 10000
  });
</script>

<section>
<hgroup>

{#if currentAbnormality === Abnormality.AN06}

## <s>イルミナティ</s> Taiwan

{:else}

## WIKIDATA Taiwan

{/if}

</hgroup>

コミュニティ共同創設者

</section>

{#if currentAbnormality === Abnormality.AN08}

{#each Array(4) as dumb, index (index) }

<section>
<hgroup>

## HITCON 2020

_Hacks in Taiwan Conference_

</hgroup>

システム開発チームメンバー

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

開発チームリーダー

</section>

{#if currentAbnormality === Abnormality.AN09}

<section>
<hgroup>

## 戻る

</hgroup>

戻る

</section>

<section>
<hgroup>

## 戻る

</hgroup>

戻る戻る戻る戻る戻る戻る戻る戻る戻る戻る戻る

</section>

{:else}

<section>
<hgroup>

## SITCON Camp 2017

_Students’ Information Technology Conferenc - Summer Camp_

</hgroup>

講座企画チーム・文創チームメンバー

</section>

<section>
<hgroup>

## Opass

</hgroup>

プロジェクトコントリビューター

</section>
{/if}
{/if}
