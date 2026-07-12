---
title: 経歴
layout: timeline
---

<script lang="ts">
	import Icon from '@iconify/svelte';
	
	import { Abnormality } from '$lib/game/abnoramlity';
	import { useTypewriter } from '$lib/helpers/typewriter.svelte';

  	let { currentAbnormality, lookupInfo }: { currentAbnormality: Abnormality } = $props();

	const an05SessionNamespace = `abnormal_temp::${Abnormality.AN05}`;

	if (currentAbnormality === Abnormality.AN05 && !sessionStorage.getItem(an05SessionNamespace)) {
		sessionStorage.setItem(an05SessionNamespace, '0');
	}

	const an05SelfDeleteExperienceOriginalStr = `文化系NPOのWebサイト、内部ツール、実用的なITインフラをゼロから整える支援を行いました。`;
	const an05SelfDeleteExperienceStr = an05SelfDeleteExperienceOriginalStr.slice(0, an05SelfDeleteExperienceOriginalStr.length - parseInt(sessionStorage.getItem(an05SessionNamespace) || '0'));
	const an05SelfDeleteExperience = useTypewriter(() => `${an05SelfDeleteExperienceStr}${'\b'.repeat(an05SelfDeleteExperienceStr.length)}`, {
		startDelay: parseInt(sessionStorage.getItem(an05SessionNamespace) || '0') > 0 ? 0 : 3000,
		startAt: () => an05SelfDeleteExperienceStr.length,
		baseInterval: Math.max(3000 - parseInt(sessionStorage.getItem(an05SessionNamespace) || '0') * 200, 100)
	});

	function lookupInfoToStr(lookupInfo: any): string {
		return [lookupInfo?.abuse?.location?.city, lookupInfo?.abuse?.location?.state, lookupInfo?.abuse?.location?.country].filter(Boolean).join(`, `) || `WHO ARE YOU?`;
	}

	$effect(() => {
		if (currentAbnormality === Abnormality.AN05) {
			sessionStorage.setItem(an05SessionNamespace, (Math.max(parseInt(sessionStorage.getItem(an05SessionNamespace) || '0'), an05SelfDeleteExperienceOriginalStr.length - an05SelfDeleteExperience.current.length)).toString());
		}
	});
</script>

<section>

{#if currentAbnormality === Abnormality.AN03}

<hgroup>

**2019/07 - 2026/04 • 7 年**

## シニアフリークエンジニア - <br />Cyberdyne Systems

_<Icon class="icon" icon="fa7-solid:location-dot" /> フリーモント、カリフォルニア州、アメリカ合衆国_

</hgroup>

クローン開発向けのサイボーグプロジェクトを立ち上げ、リード。スカイネット向けの複雑なニューラルネットワークを構築し、ターミネーターを国防総省に導入。

{:else}

<hgroup>

{#if currentAbnormality === Abnormality.AN00}

**2019/07 - {new Date().getFullYear() + 1}/04 • {new Date().getFullYear() - 2019 + 1} 年**

{:else}

**2019/07 - 2026/04 • 7 年**

{/if}

## シニアフロントエンドエンジニア - <br />Leukocyte-Lab Co., Ltd.

{#if currentAbnormality === Abnormality.AN04}
{#await lookupInfo then lookupInfo}

_<Icon class="icon" icon="fa7-solid:location-dot" /> {lookupInfo.ip}_

{/await}

{:else}

_<Icon class="icon" icon="fa7-solid:location-dot" /> 台北，台湾_

{/if}

</hgroup>

サイバーセキュリティ製品のフロントエンド開発を構築・リードし、複雑なセキュリティワークフローを使いやすいプロダクト体験へと落とし込みました。

{/if}

</section>

<section>
<hgroup>

{#if currentAbnormality === Abnormality.AN01}

**1816/06 - 2020/12 • 204 年**

{:else}

**2016/06 - 2020/12 • 4 年**

{/if}

## ボランティア - 李梅樹記念館

{#if currentAbnormality === Abnormality.AN04}
{#await lookupInfo then lookupInfo}

_<Icon class="icon" icon="fa7-solid:location-dot" /> {lookupInfoToStr(lookupInfo)}_

{/await}

{:else}

_<Icon class="icon" icon="fa7-solid:location-dot" /> 新北，台湾_

{/if}

</hgroup>

{#if currentAbnormality === Abnormality.AN05}

{an05SelfDeleteExperience.current}

{:else}

文化系NPOのWebサイト、内部ツール、実用的なITインフラをゼロから整える支援を行いました。

{/if}

</section>
