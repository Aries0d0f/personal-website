import { baseLocale, locales, localizeHref, type Locale } from '$lib/paraglide/runtime';
import { m } from '$lib/paraglide/messages.js';
import { pageOrder, pageHref, type PageKey } from '$lib/pages';

const ORIGIN = 'https://aries0d0f.me';

// English glosses are included alongside each native name because llms.txt is
// consumed by LLMs that may not otherwise recognize the native name as a
// language label.
const LANGUAGE_NAMES: Record<Locale, string> = {
	en: 'English',
	ja: '日本語 (Japanese)',
	'zh-tw': '繁體中文 (Traditional Chinese)'
};

// The base locale is canonically the un-prefixed /llms.txt (see
// src/hooks.server.ts's NON_LOCALIZED_PATHS — it must stay reachable outside
// the i18n tree for crawlers/LLMs that expect it at the well-known root
// path). Other locales use the site's normal /{locale}/path prefix, which
// Paraglide's own URL matching already resolves to this same route.
function llmsTxtUrl(locale: Locale): string {
	return locale === baseLocale ? `${ORIGIN}/llms.txt` : `${ORIGIN}/${locale}/llms.txt`;
}

function pageUrl(path: `/${string}`, locale: Locale): string {
	return ORIGIN + localizeHref(path, { locale }).replace(/\/$/, '');
}

// Paraglide messages that use inline markup (e.g. `{#strong}...{/strong}`)
// expose `.parts()`, a flat stream of text/markup tokens meant for a renderer
// to walk — ParaglideMessage.svelte walks it into Svelte elements; here it's
// walked into markdown so the plain-text bio still carries its emphasis.
const MARKUP_TOKENS: Record<string, string> = { strong: '**', em: '*' };

function renderParts(parts: readonly { type: string; value?: string; name?: string }[]): string {
	return parts
		.map((part) => (part.type === 'text' ? (part.value ?? '') : (MARKUP_TOKENS[part.name ?? ''] ?? '')))
		.join('');
}

// Raw markdown source, not the compiled mdsvex/Svelte component — llms.txt
// needs the author's text, not rendered output. Reading it eagerly means
// editing a content file changes what the next request to /llms.txt serves,
// with no separate build step to keep the two in sync.
const contentModules = import.meta.glob('/src/content/web/*/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

// Strips the mdsvex/Svelte scaffolding these files carry purely for
// rendering (frontmatter, a <script> setup block, layout wrapper tags, icon
// components) so what's left is plain, readable markdown. Each file's own
// headings (`##`) are written assuming the page itself is the top level, but
// here they're nested one level under an "## {Page title}" section, so every
// heading is demoted by one (`##` -> `###`) to keep the outline consistent.
function toPlainMarkdown(raw: string): string {
	return raw
		.replace(/^---\n[\s\S]*?\n---\n/, '')
		.replace(/<script[\s\S]*?<\/script>/g, '')
		.replace(/<[A-Za-z][\w.]*(?:\s[^>]*)?\/>\s*/g, '')
		.replace(/<\/?(?:section|hgroup)(?:\s[^>]*)?>/g, '')
		.replace(/^(#{1,5}) /gm, '#$1 ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

type ContentPageKey = Exclude<PageKey, 'home' | 'blank' | 'blank-after'>;

const CONTENT_PAGES = pageOrder.filter(
	(key): key is ContentPageKey => key !== 'home' && key !== 'blank' && key !== 'blank-after'
);

const TITLES: Record<ContentPageKey, (locale: Locale) => string> = {
	experience: (locale) => m.pages_experience_title({}, { locale }),
	community: (locale) => m.pages_community_title({}, { locale }),
	skill: (locale) => m.pages_skills_title({}, { locale })
};

export function renderLlmsTxt(locale: Locale): string {
	const languagesBlock = [
		'## Available Languages',
		'',
		locales
			.map(
				(loc) =>
					`- [${LANGUAGE_NAMES[loc]}](${llmsTxtUrl(loc)})${loc === locale ? ' — this document' : ''}`
			)
			.join('\n')
	].join('\n');

	const aboutBlock = [
		`## ${m.pages_home_title({}, { locale })}`,
		'',
		renderParts(m.pages_home_profile_intro.parts({}, { locale })),
		'',
		`> Source: ${pageUrl(pageHref('home', locale), locale)}`
	].join('\n');

	const sectionBlocks = CONTENT_PAGES.map((slug) => {
		const raw =
			contentModules[`/src/content/web/${slug}/${locale}.md`] ??
			contentModules[`/src/content/web/${slug}/en.md`];
		const body = raw ? toPlainMarkdown(raw) : '';

		return `## ${TITLES[slug](locale)}\n\n${body}\n\n> Source: ${pageUrl(pageHref(slug, locale), locale)}`;
	});

	return (
		[
			`# ${m.noun_general_name({}, { locale })}`,
			`${m.components_avatar_slogan({}, { locale })}`,
			languagesBlock,
			aboutBlock,
			...sectionBlocks
		].join('\n\n') + '\n'
	);
}
