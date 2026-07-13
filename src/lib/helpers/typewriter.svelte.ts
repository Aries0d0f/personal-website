interface Options {
	skipFirst?: boolean;
	baseInterval?: number;
	startAt?: number | (() => number);
	startDelay?: number;
	delayMap?: Record<string, number>;
}

export const TYPING_DELAY_MAP: Record<string, number> = {
	' ': 100,
	'\b': 150,
	'.': 200,
	'。': 200,
	',': 200,
	'，': 200,
	'、': 200,
	'…': 200,
	'!': 300,
	'！': 300,
	'?': 500,
	'？': 500,
	'\n': 700,
	'\t': 500
};

export const BASE_INTERVAL = 30;

export const useTypewriter = (message: () => string, options: Options = {}) => {
	const {
		baseInterval = BASE_INTERVAL,
		startAt = 0,
		startDelay = 0,
		delayMap = TYPING_DELAY_MAP,
		skipFirst = false
	} = options;

	let text = $state('');
	let isTyping = $state(false);
	let intervalId = $state<ReturnType<typeof setInterval>>();

	const prefixLength = () => (typeof startAt === 'function' ? startAt() : startAt);

	$effect(() => {
		const full = message().split('');
		const prefix = prefixLength();
		const chars = full.slice(prefix);

		text = full.slice(0, prefix).join('');
		isTyping = true;
		if (chars.length === 0) {
			isTyping = false;
			return;
		}

		let index = 0;
		let elapsed = 0;
		let nextTick = (delayMap[chars[0]] ?? baseInterval) + startDelay;

		intervalId = setInterval(() => {
			elapsed += baseInterval;
			if (elapsed < nextTick) return;

			const char = chars[index];
			if (char === '\b') {
				text = text.slice(0, -1);
			} else if (char === '\t') {
				// skip tab, which is used to slow down typing speed here.
			} else {
				text += char;
			}

			index++;

			if (index >= chars.length) {
				isTyping = false;
				clearInterval(intervalId);
				return;
			}

			nextTick += delayMap[char] ?? baseInterval;
		}, baseInterval);

		return () => {
			clearInterval(intervalId);
			isTyping = false;
		};
	});

	const settled = (message: string) => {
		let result = '';

		for (const char of message) {
			if (char === '\b') {
				result = result.slice(0, -1);
			} else {
				result += char;
			}
		}

		return result;
	};

	const skip = () => {
		clearInterval(intervalId);
		text = settled(message());
		isTyping = false;
	};

	if (skipFirst) {
		// Skip the first typing effect
		setTimeout(() => {
			skip();
		}, 1);
	}

	return {
		skip,
		get current() {
			return text;
		},
		get isTyping() {
			return isTyping;
		}
	};
};
