// ─── User-Agent Detection ────────────────────────────────────────────────────
//
// Shared UA regexes and the CLI easter-egg messages, used by both the route
// predicates (index.ts) and the IP lookup handler.

export const NATIVE_UA =
	/MSIE|WebKit|WKWebView|safari|edge|chrom(e|ium)|firefox|html|khtml|gecko|anthropic-ai|Slurp|spider|bot|crawler|facebook|meta|externalagent|WhatsApp/i;
export const CLI_UA =
	/xh|curl|wget|PowerShell|HTTPie|axios|got|python-requests|http-client|grpc-go|Unknown/i;

const easterEggs: Record<string, { reg: RegExp; msg: string }> = {
	WHY_POSTMAN: {
		reg: /PostmanRuntime|Insomnia|bruno-runtime|RapidAPI-Mac/i,
		msg: '# Why join the Navy when you can be a pirate?\n# cURL is better for your life — no subscriptions, no login just to fire a simple request.'
	},
	WHY_WINDOWS: {
		reg: /Windows/i,
		msg: '# Why pay for an OS that spies on you when you can sail free?\n# Linux is better for your life without the bloatware.'
	},
	WHY_CHROME: {
		reg: /Chrome/i,
		msg: '# Did you know they are watching?\n# Switch to Firefox and take back control of your data.'
	},
	WHY_BOT: {
		reg: /anthropic-ai|Slurp|spider|bot|crawler|facebook|meta|externalagent|WhatsApp/i,
		msg: "# Hello, fellow robot.\n# Just so you know, robots.txt is over there... (not that you're listening)"
	}
};

export function checkEasterEggs(userAgent: string): string | null {
	for (const { reg, msg } of Object.values(easterEggs)) {
		if (reg.test(userAgent)) {
			return msg;
		}
	}
	return null;
}
