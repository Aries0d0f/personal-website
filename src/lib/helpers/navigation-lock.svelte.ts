import { beforeNavigate } from '$app/navigation';
import { page } from '$app/state';

/** Disables the browser's back/forward buttons while `isLocked` is true. */
export const useNavigationLock = (isLocked: () => boolean) => {
	$effect(() => {
		if (!isLocked()) return;

		const href = page.url.href;
		const pin = () => history.pushState(null, '', href);

		pin();

		const trap = () => {
			// Deeper jumps belong to the router; pinning here would strand the player.
			if (!isLocked() || location.href !== href) return;

			pin();
		};

		window.addEventListener('popstate', trap);

		return () => window.removeEventListener('popstate', trap);
	});

	// Refuse leftover popstates in the router, but leave `goto` alone for the game.
	beforeNavigate((navigation) => {
		if (navigation.shallow && navigation.type === 'goto') return;
		if (!isLocked() || navigation.type !== 'popstate') return;

		navigation.cancel();
	});
};
