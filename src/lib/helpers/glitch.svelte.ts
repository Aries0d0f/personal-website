const GLITCH_CHARS = `X25KyE4cuv%Ob$G@6xਸ਼xG3q%S▜GLcQJGg{C7%iHvあxpGQjDs=█%pcjCYXI▆Aqr%rv5aち떺w!~<=elyhL%zG䫠Bon4pBe(w%f3XaiOZ0+臺灣獨立L8%X▓GaFLRfRWY%a6l2▚BotMY8`;

const FIB_DEPTH = 14;
const DURATION = 6000;
const BURST = 90;
const HOLD = 1500;
const MELTDOWN_INTERVAL = 40;
const MIN_INTENSITY = 0.05;
const MAX_INTENSITY = 0.85;

interface Options {
	/** How many bursts to fire. Each one is a Fibonacci step, so more depth means a longer slow ramp. */
	depth?: number;
	/** Total time from the first burst to the meltdown, in ms. */
	duration?: number;
	/** How long a single burst stays on screen before the text snaps back, in ms. */
	burst?: number;
	/** How long the text stays fully scrambled after the ramp, in ms. */
	hold?: number;
	/** Ratio of characters replaced, on the first and the last burst. */
	minIntensity?: number;
	maxIntensity?: number;
	charset?: string;
	onComplete?: () => void;
}

/** Fibonacci from 1, so no zero-length gap sneaks in at the end. */
const fibonacci = (n: number) => {
	const fib = [1, 1];

	while (fib.length < n) {
		fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
	}

	return fib.slice(0, n);
};

/**
 * Corrupts `source` with an accelerating burst of glitch characters once `active` turns true:
 * a rare flicker at first, then a meltdown, paced by a reversed Fibonacci sequence.
 */
export const useGlitch = (source: () => string, active: () => boolean, options: Options = {}) => {
	const {
		depth = FIB_DEPTH,
		duration = DURATION,
		burst = BURST,
		hold = HOLD,
		minIntensity = MIN_INTENSITY,
		maxIntensity = MAX_INTENSITY,
		charset = GLITCH_CHARS,
		onComplete
	} = options;

	// `null` means the text is intact, so `current` falls through to the live source.
	let noise = $state<string | null>(null);

	const scramble = (text: string, intensity: number) =>
		text
			.split('')
			.map((char) =>
				char === '\n' || Math.random() > intensity
					? char
					: charset[Math.floor(Math.random() * charset.length)]
			)
			.join('');

	$effect(() => {
		if (!active()) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			const timeout = setTimeout(() => onComplete?.(), duration + hold);
			return () => clearTimeout(timeout);
		}

		// Reversed, so the gaps shrink: a long wait before the first burst, a few ms before the last.
		const gaps = fibonacci(depth).reverse();
		const scale = duration / gaps.reduce((sum, gap) => sum + gap, 0);

		let index = 0;
		let gapTimeout: ReturnType<typeof setTimeout>;
		let burstTimeout: ReturnType<typeof setTimeout>;
		let meltdown: ReturnType<typeof setInterval>;
		let meltdownTimeout: ReturnType<typeof setTimeout>;

		const ramp = () => {
			if (index >= gaps.length) {
				meltdown = setInterval(() => {
					noise = scramble(source(), maxIntensity);
				}, MELTDOWN_INTERVAL);
				meltdownTimeout = setTimeout(() => {
					clearInterval(meltdown);
					onComplete?.();
				}, hold);
				return;
			}

			const gap = gaps[index] * scale;
			const progress = index / (gaps.length - 1);
			// Squared, so the intensity holds back while the gaps are still long.
			const intensity = minIntensity + (maxIntensity - minIntensity) * progress ** 2;

			gapTimeout = setTimeout(() => {
				noise = scramble(source(), intensity);
				// Once the gaps get shorter than a burst, the bursts overlap and the text never recovers.
				burstTimeout = setTimeout(() => (noise = null), Math.min(burst, gap / 2));

				index++;
				ramp();
			}, gap);
		};

		ramp();

		return () => {
			clearTimeout(gapTimeout);
			clearTimeout(burstTimeout);
			clearTimeout(meltdownTimeout);
			clearInterval(meltdown);
			noise = null;
		};
	});

	return {
		get current() {
			return noise ?? source();
		},
		get isGlitching() {
			return noise !== null;
		}
	};
};
