---
title: スキル
layout: bento
---

<script lang="ts">
  import { Abnormality } from '$lib/game/abnoramlity';
  import { zalgoGeneration } from '$lib/shared/zalgo';
  
  let { currentAbnormality }: { currentAbnormality: Abnormality } = $props();

  let an13OriginalText = 'Gobstone, Gargoyle, Pensieve, Elder Wands';
  let an13Text = $state(an13OriginalText);
  let an13CursedLevel = $state(-20);

  $effect(() => {
    if (currentAbnormality === Abnormality.AN13) {
      const interval = setInterval(() => {
        an13CursedLevel = an13CursedLevel + 1
        if (an13CursedLevel > 100) {
          clearInterval(interval);
          return;
        }
        an13Text = zalgoGeneration(an13OriginalText, an13CursedLevel, 0, an13CursedLevel);
      }, 100);

      return () => clearInterval(interval);
    }
  });
</script>

{#if currentAbnormality === Abnormality.AN11}

<section>

## ニャー

ニャー、ニャー

ニャー、ニャー、ニャー、ニャー、ニャー、ニャー、ニャー、ニャー、ニャー、ニャー

</section>

<section>

## ニャー、ニャーニャー

ニャー、ニャー

ニャー、ニャー、ニャー、ニャー、ニャー、ニャー、ニャー

</section>

<section size="full">

## ニャー

ニャー、ニャー

ニャー、ニャー、ニャー、ニャー、ニャー、ニャー

</section>

<section>

## ニャー、ニャーニャー

ニャー、ニャー

ニャー、ニャー、ニャー、ニャー、ニャー、ニャー

</section>

<section>

## ニャー、ニャーニャー

ニャー、ニャー

ニャー、ニャー、ニャー、ニャー、ニャー、ニャー

</section>

<section size="full">

## ニャー、ニャーニャー

ニャー、ニャー

ニャー、ニャー、ニャー、ニャー、ニャー、ニャー

</section>

<section size="full">

## ニャー、ニャーニャー

ニャー、ニャー

ニャー、ニャー、ニャー、ニャー、ニャー、ニャー

</section>

{:else}

<section>

## フロントエンド

Vue, Svelte, Angular

Pinia, SvelteKit, Nuxt, React, Redux, Web Worker, GSAP, SASS, Tailwind, CSS-in-JS, RxJS, D3.js, p5.js, Three.js

</section>

<section>

## バックエンドと統合

Express, Koa, Iris

RESTful API, GraphQL, WebSocket, gRPC, Protobuf, GORM, OpenAPI, Nginx, Server Polling

</section>

<section size="full">

## プログラミング言語

{#if currentAbnormality === Abnormality.AN10}

⏁⊬⌿⟒⌇☊⍀⟟⌿⏁, ⟊⏃⎐⏃⌇☊⍀⟟⌿⏁, ☌⍜⌰⏃⋏☌

TlhIngan Hol, Galactic Basic

{:else}

TypeScript, JavaScript, Golang

Node.js, Python, Shell Scripting

{/if}

</section>

<section>

## DevOps、ｸﾗｳﾄﾞﾈﾃｨﾌﾞ

Kubernetes, Docker

Helm, Terraform, Argo CD, GitHub Actions, Traefik, Istio, Jenkins

</section>

{#if currentAbnormality === Abnormality.AN12}

<section class="noise"></section>

{:else}

<section>

## テストと品質管理

Vitest, Storybook

Cypress, Playwright, Chromatic, Sentry

</section>

{/if}

<section style="z-index: 9999;" size="full">

## プラットフォームとツール

{#if currentAbnormality === Abnormality.AN13}

<p style="font-family: Helvetica, Arial, sans-serif; z-index: 9999;">{an13Text}</p>

Pensieve, Nimbus 2000, Model Dragon, Howler

{:else}

Git, Linux, Google Cloud, Cloudflare Workers

VMware ESXi, Proxmox VE, RouterOS, Figma

{/if}

</section>

<section size="full">

## インフラストラクチャー

ネットワーク構築、サーバー管理

コンピュータハードウェアの修理、
コンピュータ設備の調達と導入

</section>

{/if}
