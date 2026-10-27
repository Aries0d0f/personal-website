import { SvelteSet } from 'svelte/reactivity';

type Swap = () => void | Promise<void>;
type Cycle = (swap: Swap) => Promise<void>;

interface Routines {
	/** Tear, collapse to a line, swap while the screen is dark, then sweep back open. */
	powerCycle: Cycle;
	/** Tear and chroma-split in place. Nothing is swapped, the picture just has to survive it. */
	interference: Cycle;
	/** Overdrive the tube with static until it whites out, swap inside the blowout, fade back in. */
	burnOut: Cycle;
	/** Put the tube back on top of the top layer, after whatever was just promoted into it. */
	promote: () => void;
}

type CycleName = 'powerCycle' | 'interference' | 'burnOut';

const noop = () => {};

let routines: Routines | null = null;
let running = $state(false);

// Overlays above modal dialogs but under the tube, ordered by promotion order.
const layers = new SvelteSet<HTMLElement>();

const repromote = (el: HTMLElement) => {
	if (el.matches(':popover-open')) el.hidePopover();
	el.showPopover();
};

export const useCRT = () => {
	const register = (fns: Routines) => {
		routines = fns;

		return () => {
			if (routines === fns) routines = null;
		};
	};

	const prefersReducedMotion = () =>
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Exclusive cycles swap the page and take the lock; others are pure decoration.
	const run = async (name: CycleName, swap: Swap, exclusive = true) => {
		const routine = routines?.[name];

		if (!routine || prefersReducedMotion()) {
			await swap();
			return;
		}

		if (!exclusive) {
			await routine(swap);
			return;
		}

		// The swap must land even if the tube is mid-cycle; only the show is skipped.
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

	// Promote on mount, keep the tube above it, leave the top layer on destroy.
	const underGlass = (el: HTMLElement) => {
		layers.add(el);
		el.showPopover();
		routines?.promote();

		return {
			destroy: () => {
				layers.delete(el);
				if (el.matches(':popover-open')) el.hidePopover();
			}
		};
	};

	return {
		register,
		prefersReducedMotion,
		powerCycle: (swap: Swap) => run('powerCycle', swap),
		burnOut: (swap: Swap) => run('burnOut', swap),
		interference: () => run('interference', noop, false),
		underGlass,
		// Top layer paints in promotion order: re-promote layers first, the tube last.
		promote: () => {
			for (const el of layers) repromote(el);
			routines?.promote();
		},
		get isRunning() {
			return running;
		}
	};
};
