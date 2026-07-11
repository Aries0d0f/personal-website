type Swap = () => void | Promise<void>;
type Cycle = (swap: Swap) => Promise<void>;

interface Routines {
	/** Tear, collapse to a line, swap while the screen is dark, then sweep back open. */
	powerCycle: Cycle;
	/** Tear and chroma-split in place. Nothing is swapped, the picture just has to survive it. */
	interference: Cycle;
	/** Overdrive the tube with static until it whites out, swap inside the blowout, fade back in. */
	burnOut: Cycle;
}

const noop = () => {};

let routines: Routines | null = null;
let running = $state(false);

export const useCRT = () => {
	const register = (fns: Routines) => {
		routines = fns;

		return () => {
			if (routines === fns) routines = null;
		};
	};

	const prefersReducedMotion = () =>
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// `exclusive` cycles take the tube for themselves: they swap the page underneath, so a
	// second one must not start on top of them. A non-exclusive cycle is pure decoration —
	// it neither takes the lock nor waits on it, so it can never hold the tube shut for a
	// cycle that has somewhere to be.
	const run = async (name: keyof Routines, swap: Swap, exclusive = true) => {
		const routine = routines?.[name];

		if (!routine || prefersReducedMotion()) {
			await swap();
			return;
		}

		if (!exclusive) {
			await routine(swap);
			return;
		}

		// The transition is decoration, the swap is not: whoever asked for the cycle is
		// waiting on the page underneath to change. If the tube is already mid-cycle the
		// swap still has to land — it just lands without the show.
		if (running) {
			await swap();
			return;
		}

		running = true;
		try {
			await routine(swap);
		} finally {
			running = false;
		}
	};

	return {
		register,
		prefersReducedMotion,
		powerCycle: (swap: Swap) => run('powerCycle', swap),
		burnOut: (swap: Swap) => run('burnOut', swap),
		interference: () => run('interference', noop, false),
		get isRunning() {
			return running;
		}
	};
};
