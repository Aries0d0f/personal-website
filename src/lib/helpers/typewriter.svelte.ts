const TYPING_DELAY_MAP: Record<string, number> = {
	' ': 100,
	'\b': 150,
	'.': 200,
	',': 200,
	'!': 300,
	'?': 500,
	'\n': 700
};

const BASE_INTERVAL = 30;

interface Options {
	skipFirst?: boolean;
	baseInterval?: number;
	startAt?: number;
	startDelay?: number;
	delayMap?: Record<string, number>;
}

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

	$effect(() => {
		const chars = message().split('').slice(startAt);

		text = message().split('').slice(0, startAt).join('');
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

	const skip = () => {
		clearInterval(intervalId);
		text = message();
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
