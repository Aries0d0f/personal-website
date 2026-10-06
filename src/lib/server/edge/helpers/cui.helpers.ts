// ─── Text-Mode CUI Drawing ───────────────────────────────────────────────────
//
import { Ansis } from 'ansis';

export type Options = {
	plainText?: boolean;
};

const ANSI = new Ansis(3);

export const ASCII_ART_LINE = `


        ░░                            ░░
         ░▒▒░░    ░░░░░░░░░░░░    ░░▒▒░
         ░▒▒▒▒░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░▒▒▒▒░
        ░░▓▓▓▓████████████████████▓▓▓▓░░
    ░░▒▒▓▓██████░░████████████░░██████▓▓▒▒░░
    ░░▓███████████████▓▓▓▓███████████████▓░░
    ▒▓████▓▓████████████████████████▓▓████▓▒
    ▒▒▓██▓░░░░▓▓████████████████▓▓░░░░▓██▓▒▒
      ▒▒██░░░░░░░░░░░░░░░░░░░░░░░░░░░░██▒▒
      ▒▒██░░░░░░░░░░░░░░░░░░░░░░░░░░░░██▒▒  ░░░
      ▒▒▓▓░░░░██░░██░░░░░░░░██░░██░░░░▒▓▒▒ ░░
      ▒▒▒▒░░░░▓████▓░░░░░░░░▓████▓░░░░▒▒▒▒ ░░
       ▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒   ░░
       ░░▒▒░░░░░░░░░░░░▒▒░░░░░░░░░░░░▒▒░░   ░░
       ░░░░▒░░░░░░░░░░░░░░░░░░░░░░░░▒░░░░░░░░
       ░░░░░░░░░░▒▒▒▒▒▒▓▓▒▒▒▒▒▒░░░░░░░░░░░
        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
             ░░░░░░░░░░░░░░░░░░░░░░



`
	.split('\n')
	.slice(1, -1);

const ART_WIDTH = Math.max(...ASCII_ART_LINE.map((l) => l.length));
const ART_GAP = '  ';

// Widest label column in fancy mode; plain mode keeps each caller's own pad.
const FANCY_PAD = 14;

const PALETTE = [
	[
		ANSI.bgBlack,
		ANSI.bgRed,
		ANSI.bgGreen,
		ANSI.bgYellow,
		ANSI.bgBlue,
		ANSI.bgMagenta,
		ANSI.bgCyan,
		ANSI.bgWhite
	],
	[
		ANSI.bgGray,
		ANSI.bgRedBright,
		ANSI.bgGreenBright,
		ANSI.bgYellowBright,
		ANSI.bgBlueBright,
		ANSI.bgMagentaBright,
		ANSI.bgCyanBright,
		ANSI.bgWhiteBright
	]
];

export const useCuiHelper = (lines: string[] = [], options?: Options) => {
	const { plainText = false } = options ?? {};

	const SEPARATOR = '='.repeat(52);
	const DIVIDER = '-'.repeat(52);

	// Fancy rows inside a section are drawn with `├`, and the last one is
	// rewritten to `└` once we know the section is over.
	let inSection = false;
	let lastRow: { index: number; body: string } | null = null;

	const closeSection = (): void => {
		if (lastRow) lines[lastRow.index] = `${ANSI.dim('└')} ${lastRow.body}`;
		lastRow = null;
	};

	/** Fastfetch-style `user@host` heading. Fancy mode only. */
	const title = (s: string): void => {
		if (plainText) return;
		lines.push(ANSI.green.bold(s), ANSI.dim('-'.repeat(s.length)));
	};

	/** Report heading. */
	const banner = (s: string): void => {
		if (plainText) {
			lines.push(SEPARATOR, `  ${s}`, SEPARATOR);
			return;
		}
		closeSection();
		inSection = false;
		lines.push(ANSI.yellow.bold(s), ANSI.dim('-'.repeat(s.length)));
	};

	/** Section heading inside a report. */
	const head = (s: string): void => {
		if (plainText) {
			lines.push(DIVIDER, `  ${s}`, DIVIDER);
			return;
		}
		closeSection();
		if (inSection) lines.push('');
		inSection = true;
		lines.push(`${ANSI.magenta('◆')} ${ANSI.magenta.bold(s)}`);
	};

	const pushRow = (label: string, value: unknown, pad: number, separator: string): void => {
		if (plainText) {
			lines.push(`${(label + separator).padEnd(pad)} ${value}`);
			return;
		}

		const key = ANSI.cyan.bold(label.padEnd(Math.min(pad - 1, FANCY_PAD)));

		if (!inSection) {
			lines.push(`${key} ${ANSI.dim('→')} ${value}`);
			return;
		}

		const body = `${key} ${ANSI.dim('→')} ${value}`;
		lastRow = { index: lines.length, body };
		lines.push(`${ANSI.dim('├')} ${body}`);
	};

	/** `Label: value` row; skipped when the value is empty. */
	const row = (label: string, value: unknown, pad = 24): void => {
		if (value == null || value === '') return;
		pushRow(label, value, pad, ':');
	};

	/** Raw WHOIS-style `name value` row, no colon, never skipped. */
	const attr = (name: string, value: unknown, pad = 20): void => {
		pushRow(name, value, pad, '');
	};

	/** Free text (comments, notes). Dimmed in fancy mode. */
	const text = (...s: string[]): void => {
		if (plainText) {
			lines.push(...s);
			return;
		}
		closeSection();
		inSection = false;
		lines.push(...s.map((l) => ANSI.dim(l)));
	};

	/** Closes a report, with an optional `Query completed` style note. */
	const footer = (note?: string): void => {
		if (plainText) {
			lines.push(...(note ? [DIVIDER, `  ${note}`] : []), SEPARATOR);
			return;
		}
		closeSection();
		inSection = false;
		if (note) lines.push('', ANSI.dim.italic(note));
	};

	const bool = (v: unknown): string => {
		if (plainText) return v ? 'Yes' : 'No';
		return v ? ANSI.green.bold('✔ Yes') : ANSI.red.bold('✘ No');
	};

	const flag = (v: unknown): string => {
		if (plainText) return v ? 'YES' : 'No';
		return v ? ANSI.green.bold('✔ YES') : ANSI.red.bold('✘ NO');
	};

	return {
		SEPARATOR,
		DIVIDER,
		title,
		banner,
		head,
		row,
		attr,
		text,
		footer,
		bool,
		flag
	};
};

/**
 * Lays the final report out for the response. Plain text is returned as-is;
 * fancy mode puts the ANSI art beside the report and a color palette below.
 */
export const renderScreen = (body: string, options?: Options): string => {
	const { plainText = false } = options ?? {};
	if (plainText) return body;

	const info = body.replaceAll('\r', '').split('\n');
	while (info.length && info[info.length - 1].trim() === '') info.pop();

	info.push('', ...PALETTE.map((colors) => colors.map((bg) => bg('   ')).join('')));

	const height = Math.max(info.length, ASCII_ART_LINE.length);
	const out: string[] = [];

	for (let i = 0; i < height; i++) {
		const art = (ASCII_ART_LINE[i] ?? '').padEnd(ART_WIDTH);
		const line = info[i] ?? '';
		out.push(line ? `${ANSI.white(art)}${ART_GAP}${line}` : ANSI.white(art.trimEnd()));
	}

	return out.join('\n') + '\n';
};
