type Swap = () => void | Promise<void>;
type PowerCycle = (swap: Swap) => Promise<void>;

let screenPowerCycle: PowerCycle | null = null;
let running = $state(false);

export const useCRT = () => {
	const register = (fn: PowerCycle) => {
		screenPowerCycle = fn;

		return () => {
			if (screenPowerCycle === fn) screenPowerCycle = null;
		};
	};

	const prefersReducedMotion = () =>
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const powerCycle = async (swap: Swap) => {
		if (running) return;

		if (!screenPowerCycle || prefersReducedMotion()) {
			await swap();
			return;
		}

		running = true;
		try {
			await screenPowerCycle(swap);
		} finally {
			running = false;
		}
	};

	return {
		register,
		powerCycle,
		prefersReducedMotion,
		get isRunning() {
			return running;
		}
	};
};
