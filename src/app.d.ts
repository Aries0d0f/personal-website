// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}

		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		// interface Locals {}
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
