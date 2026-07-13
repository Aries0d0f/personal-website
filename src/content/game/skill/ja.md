---
title: スキル
layout: bento
---

<script lang="ts">
  import { Abnormality } from '$lib/game/abnoramlity';

  let { currentAbnormality }: { currentAbnormality: Abnormality } = $props();
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

TypeScript, JavaScript, Golang

{#if currentAbnormality === Abnormality.AN10}

TlhIngan Hol, Galactic Basic

{:else}

Node.js, Python, Shell Scripting

{/if}

</section>

<section size="{currentAbnormality === Abnormality.AN12 ? 'full' : undefined}">

## DevOps、ｸﾗｳﾄﾞﾈﾃｨﾌﾞ

Kubernetes, Docker

Helm, Terraform, Argo CD, GitHub Actions, Traefik, Istio, Jenkins

</section>

{#if currentAbnormality !== Abnormality.AN12}

<section>

## テストと品質管理

Vitest, Storybook

Cypress, Playwright, Chromatic, Sentry

</section>

{/if}

<section size="full">

## プラットフォームとツール

{#if currentAbnormality === Abnormality.AN13}

Gobstone, Gargoyle, Pensieve, Elder Wands

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
