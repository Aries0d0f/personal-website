---
title: Skills
layout: bento
---

<script lang="ts">
  import { Abnormality } from '$lib/game/abnoramlity';

  let { currentAbnormality }: { currentAbnormality: Abnormality } = $props();
</script>

{#if currentAbnormality === Abnormality.AN11}

<section>

## Meow

Meow, Meow, Meow

Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow

</section>

<section>

## Meow, Meow Meow

Meow, Meow, Meow

Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow

</section>

<section size="full">

## Meow

Meow, Meow, Meow

Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow

</section>

<section>

## Meow, Meow Meow

Meow, Meow, Meow

Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow

</section>

<section>

## Meow, Meow Meow

Meow, Meow, Meow

Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow

</section>

<section size="full">

## Meow, Meow Meow

Meow, Meow, Meow

Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow

</section>

<section size="full">

## Meow, Meow Meow

Meow, Meow, Meow

Meow, Meow, Meow, Meow, Meow, Meow, Meow, Meow

</section>

{:else}

<section>

## Frontend

Vue, Svelte, Angular

Pinia, SvelteKit, Nuxt, React, Redux, Web Worker, GSAP, SASS, Tailwind, CSS-in-JS, RxJS, D3.js, p5.js, Three.js

</section>

<section>

## Backend & Integration

Express, Koa, Iris

RESTful API, GraphQL, WebSocket, gRPC, Protobuf, GORM, OpenAPI, Nginx, Server Polling

</section>

<section size="full">

## Programming Language

TypeScript, JavaScript, Golang

{#if currentAbnormality === Abnormality.AN10}

TlhIngan Hol, Galactic Basic

{:else}

Node.js, Python, Shell Scripting

{/if}

</section>

<section size="{currentAbnormality === Abnormality.AN12 ? 'full' : undefined}">

## DevOps & Cloud Native

Kubernetes, Docker

Helm, Terraform, Argo CD, GitHub Actions, Traefik, Istio, Jenkins

</section>

{#if currentAbnormality !== Abnormality.AN12}

<section>

## Testing & Quality

Vitest, Storybook

Cypress, Playwright, Chromatic, Sentry

</section>

{/if}

<section size="full">

## Platform & Tools

{#if currentAbnormality === Abnormality.AN13}

Gobstone, Gargoyle, Pensieve, Elder Wands

Pensieve, Nimbus 2000, Model Dragon, Howler

{:else}

Git, Linux, Google Cloud, Cloudflare Workers
VMware ESXi, Proxmox VE, RouterOS, Figma

{/if}

</section>

<section size="full">

## Infrastructure

Networking, Server Management

Computer Hardware Repair,
Procurement & Deployment of Computer Facilities

</section>

{/if}
