import { beforeNavigate } from '$app/navigation';
import { page } from '$app/state';

/**
 * Takes the browser's back/forward buttons away for as long as `isLocked` stays true:
 * the only way out is the one the page hands the player.
 */
export const useNavigationLock = (isLocked: () => boolean) => {
	$effect(() => {
		if (!isLocked()) return;

		const href = page.url.href;
		const pin = () => history.pushState(null, '', href);

		pin();

		const trap = () => {
			// A jump further back lands on another page; that one belongs to the router,
			// which is about to restore it, so pinning here would strand the player.
			if (!isLocked() || location.href !== href) return;

			pin();
		};

		window.addEventListener('popstate', trap);

		return () => window.removeEventListener('popstate', trap);
	});

	// Whatever the decoy fails to swallow still reaches the router. Refuse it there,
	// while leaving `goto` alone so the game can still move the player itself.
	beforeNavigate((navigation) => {
		if (!isLocked() || navigation.type !== 'popstate') return;

		navigation.cancel();
	});
};
