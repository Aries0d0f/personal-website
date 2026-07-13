---
title: 經驗
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

	const an05SelfDeleteExperienceOriginalStr = `協助文化型非營利組織從零建立網站、內部工具與實用的 IT 基礎設施。`;
	const an05SelfDeleteExperienceStr = an05SelfDeleteExperienceOriginalStr.slice(0, an05SelfDeleteExperienceOriginalStr.length - parseInt(sessionStorage.getItem(an05SessionNamespace) || '0'));
	const an05SelfDeleteExperience = useTypewriter(() => `${an05SelfDeleteExperienceStr}${'\b'.repeat(an05SelfDeleteExperienceStr.length)}`, {
		startDelay: parseInt(sessionStorage.getItem(an05SessionNamespace) || '0') > 0 ? 0 : 1000,
		startAt: () => an05SelfDeleteExperienceStr.length,
		baseInterval: Math.max(1000 - parseInt(sessionStorage.getItem(an05SessionNamespace) || '0') * 200, 100)
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

## 資深瘋狂工程師 - 賽博坦公司

_<Icon class="icon" icon="fa7-solid:location-dot" /> 佛利蒙, 加州, 美國_

</hgroup>

主導並帶領複製人用的機器改造人專案，為天網打造複雜的神經網路，並將終結者導入國防部。

{:else}

<hgroup>

{#if currentAbnormality === Abnormality.AN00}

**2019/07 - {new Date().getFullYear() + 1}/04 • {new Date().getFullYear() - 2019 + 1} 年**

{:else}

**2019/07 - 2026/04 • 7 年**

{/if}

## 資深前端工程師 - 盧氪賽忒股份有限公司

{#if currentAbnormality === Abnormality.AN04}
{#await lookupInfo then lookupInfo}

_<Icon class="icon" icon="fa7-solid:location-dot" /> {lookupInfo.ip}_

{/await}

{:else}

_<Icon class="icon" icon="fa7-solid:location-dot" /> 臺北，臺灣_

{/if}

</hgroup>

為資安產品打造並主導前端開發，將複雜的資安流程轉化為易於使用的產品體驗。

{/if}

</section>

<section>
<hgroup>

{#if currentAbnormality === Abnormality.AN01}

**1816/06 - 2020/12 • 204 年**

{:else}

**2016/06 - 2020/12 • 4 年**

{/if}

## 資訊組志工 - 李梅樹紀念館

{#if currentAbnormality === Abnormality.AN04}
{#await lookupInfo then lookupInfo}

_<Icon class="icon" icon="fa7-solid:location-dot" /> {lookupInfoToStr(lookupInfo)}_

{/await}

{:else}

_<Icon class="icon" icon="fa7-solid:location-dot" /> 新北，臺灣_

{/if}

</hgroup>

{#if currentAbnormality === Abnormality.AN02}

施設礎基 TI 的用實與具工部內、站網立建零從織組利營非型化文助協。

{:else}

{#if currentAbnormality === Abnormality.AN05}

{an05SelfDeleteExperience.current}

{:else}

協助文化型非營利組織從零建立網站、內部工具與實用的 IT 基礎設施。

{/if}
{/if}

</section>
