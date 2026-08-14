// ─── Text-Mode CUI Drawing ───────────────────────────────────────────────────
//
// Shared primitives for the plain-text WHOIS/abuse/geo report formatters —
// a bordered section header and a padded label/value row.

export const SEPARATOR = '='.repeat(52);
export const DIVIDER = '-'.repeat(52);

export function head(lines: string[], title: string): void {
	lines.push(DIVIDER, `  ${title}`, DIVIDER);
}

export function row(lines: string[], label: string, value: unknown, pad = 24): void {
	if (value == null || value === '') return;
	lines.push(`${(label + ':').padEnd(pad)} ${value}`);
}

export function bool(v: unknown): string {
	return v ? 'Yes' : 'No';
}

export function flag(v: unknown): string {
	return v ? 'YES' : 'No';
}
