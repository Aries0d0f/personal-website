// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { GameState } from '#lib/game/state.js';

declare global {
	namespace App {
		interface Locals {
			/** Decoded from the signed game cookie by handleGame in hooks.server.ts. */
			game: GameState;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}

	// Dev-only handle for scrubbing the CRT cycles in GSDevTools.
	interface Window {
		crt?: {
			debug: (cycle?: 'power' | 'burn') => Promise<void>;
			close: () => void;
			preview: (callback: () => void) => void;
			glitch: () => Promise<void>;
			burn: (callback: () => void) => Promise<void>;
		};
	}
}

export {};
