import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: { adapter: adapter() },
	preprocess: [
		vitePreprocess({
			style: true
		}),
		mdsvex({ extensions: ['.svx', '.md'] })
	],
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
