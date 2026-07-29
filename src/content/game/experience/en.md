---
title: Experience
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

	const an05SelfDeleteExperienceOriginalStr = `Supported a cultural NPO by building websites, internal tools, and practical IT infrastructure from the ground up.`;
	const an05SelfDeleteExperienceStr = an05SelfDeleteExperienceOriginalStr.slice(0, an05SelfDeleteExperienceOriginalStr.length - parseInt(sessionStorage.getItem(an05SessionNamespace) || '0'));
	const an05SelfDeleteExperience = useTypewriter(() => `${an05SelfDeleteExperienceStr}${'\b'.repeat(an05SelfDeleteExperienceStr.length)}`, {
		startDelay: parseInt(sessionStorage.getItem(an05SessionNamespace) || '0') > 0 ? 0 : 1000,
		startAt: () => an05SelfDeleteExperienceStr.length,
		baseInterval: Math.max(1000 - parseInt(sessionStorage.getItem(an05SessionNamespace) || '0') * 200, 100)
	});

	function lookupInfoToStr(lookupInfo: any): string {
		return Array.from(new Set([lookupInfo?.geo?.district, lookupInfo?.geo?.city, lookupInfo?.geo?.regionName, lookupInfo?.geo?.country].filter(Boolean))).join(`, `) || `WHO ARE YOU?`;
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

**2019 JUL - 2026 APR • 7 Years**

## Senior Freak Enginner - Cyberdyne Systems

_<Icon class="icon" icon="fa7-solid:location-dot" /> Fremont, California, USA_

</hgroup>

Built and led cyborg project for cloner, turning complex neural networks for Skynet, introduce terminator to Pentagon.

{:else}

<hgroup>

{#if currentAbnormality === Abnormality.AN00}

**2019 JUL - {new Date().getFullYear() + 1} APR • {new Date().getFullYear() - 2019 + 1} Years**

{:else}

**2019 JUL - 2026 APR • 7 Years**

{/if}

## Senior Frontend Enginner - Leukocyte-Lab

{#if currentAbnormality === Abnormality.AN04}
{#await lookupInfo then lookupInfo}

_<Icon class="icon" icon="fa7-solid:location-dot" /> {lookupInfo.ip}_

{/await}

{:else}

_<Icon class="icon" icon="fa7-solid:location-dot" /> Taipei, Taiwan_

{/if}

</hgroup>

Built and led frontend work for cybersecurity products, turning complex security workflows into usable product experiences.

{/if}

</section>

<section>
<hgroup>

{#if currentAbnormality === Abnormality.AN01}

**1816 JUN - 2020 DEC • 204 Years**

{:else}

**2016 JUN - 2020 DEC • 4 Years**

{/if}

## Volunteer - Li Mei-Shu Memorial Gallery

{#if currentAbnormality === Abnormality.AN04}
{#await lookupInfo then lookupInfo}

_<Icon class="icon" icon="fa7-solid:location-dot" /> {lookupInfoToStr(lookupInfo)}_

{/await}

{:else}

_<Icon class="icon" icon="fa7-solid:location-dot" /> New Taipei, Taiwan_

{/if}

</hgroup>

{#if currentAbnormality === Abnormality.AN02}

Up ground the from infrastructure IT practical and tools, internal websites, building by NPO cultural a supported.

{:else}

{#if currentAbnormality === Abnormality.AN05}

{an05SelfDeleteExperience.current}

{:else}

Supported a cultural NPO by building websites, internal tools, and practical IT infrastructure from the ground up.

{/if}
{/if}

</section>
