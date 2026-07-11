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

	// Dev-only handle for scrubbing the CRT power cycle in GSDevTools.
	interface Window {
		crt?: {
			debug: () => Promise<void>;
			close: () => void;
			preview: (callback: () => void) => void;
		};
	}
}

export {};
