import { baseLocale, locales, localizeHref, type Locale } from '#lib/paraglide/runtime.js';
import { m } from '#lib/paraglide/messages.js';
import { pageOrder, pageHref, type PageKey } from '#lib/pages.js';

const ORIGIN = 'https://aries0d0f.me';

// English glosses help LLMs recognize native language names.
const LANGUAGE_NAMES: Record<Locale, string> = {
	en: 'English',
	ja: '日本語 (Japanese)',
	'zh-tw': '繁體中文 (Traditional Chinese)'
};

// Base locale stays at bare /llms.txt (see NON_LOCALIZED_PATHS in hooks).
function llmsTxtUrl(locale: Locale): string {
	return locale === baseLocale ? `${ORIGIN}/llms.txt` : `${ORIGIN}/${locale}/llms.txt`;
}

function pageUrl(path: `/${string}`, locale: Locale): string {
	return ORIGIN + localizeHref(path, { locale }).replace(/\/$/, '');
}

// Walk Paraglide `.parts()` markup tokens into markdown emphasis.
const MARKUP_TOKENS: Record<string, string> = { strong: '**', em: '*' };

function renderParts(parts: readonly { type: string; value?: string; name?: string }[]): string {
	return parts
		.map((part) =>
			part.type === 'text' ? (part.value ?? '') : (MARKUP_TOKENS[part.name ?? ''] ?? '')
		)
		.join('');
}

// Raw markdown source, not the compiled component.
const contentModules = import.meta.glob('/src/content/web/*/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

// Strip mdsvex scaffolding and demote headings one level.
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
