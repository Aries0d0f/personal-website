import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-cloudflare';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// content/ lives outside src, so Vite's dev server must allow it explicitly.
	server: {
		fs: { allow: ['./content'] },
		proxy: {
			'/ip': {
				target: 'https://aries0d0f.me/ip',
				changeOrigin: true
			}
		}
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			inlineStyleThreshold: Infinity,
			preprocess: [vitePreprocess({ style: true }), mdsvex({ extensions: ['.svx', '.md'] })],
			extensions: ['.svelte', '.svx', '.md'],
			adapter: adapter()
		}),

		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// URL wins; Accept-Language seeds first visits. Root redirect is in hooks.
			strategy: ['url', 'preferredLanguage', 'baseLocale'],
			// Prefix every locale, including base; bare `/` is redirected in hooks.
			urlPatterns: [
				{
					pattern: '/:path(.*)?',
					localized: [
						['en', '/en/:path(.*)?'],
						['ja', '/ja/:path(.*)?'],
						['zh-tw', '/zh-tw/:path(.*)?']
					]
				}
			]
		})
	]
});
