const TYPING_DELAY_MAP: Record<string, number> = {
	' ': 100,
	'.': 200,
	',': 200,
	'!': 300,
	'?': 500,
	'\n': 700
};

const BASE_INTERVAL = 30;

interface Options {
	baseInterval?: number;
	delayMap?: Record<string, number>;
}

export const useTypewriter = (message: () => string, options: Options = {}) => {
	const { baseInterval = BASE_INTERVAL, delayMap = TYPING_DELAY_MAP } = options;

	let text = $state('');
	let isTyping = $state(false);
	let intervalId = $state<ReturnType<typeof setInterval>>();

	$effect(() => {
		const chars = message().split('');

		text = '';
		isTyping = true;
		if (chars.length === 0) {
			isTyping = false;
			return;
		}

		let index = 0;
		let elapsed = 0;
		let nextTick = delayMap[chars[0]] ?? baseInterval;

		intervalId = setInterval(() => {
			elapsed += baseInterval;
			if (elapsed < nextTick) return;

			text += chars[index];
			index++;

			if (index >= chars.length) {
				isTyping = false;
				clearInterval(intervalId);
				return;
			}

			nextTick += delayMap[chars[index]] ?? baseInterval;
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
