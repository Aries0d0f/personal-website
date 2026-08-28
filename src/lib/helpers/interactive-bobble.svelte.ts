type Bobble = {
    message?: string;
    link?: string;
    icon?: string;
}

export const useInteractiveBobble = (ignore: () => boolean) => {
    let bobble = $state<Bobble>();
    let bobbleClearTimeout: ReturnType<typeof setTimeout>;

	const handler = (event: MouseEvent) => {
        if (ignore()) return;

		const hoveredElement = event.target as HTMLElement;
        const attredElement = hoveredElement.closest('[data-bobble-msg], [data-bobble-icon], [data-bobble-link], [aria-label]') as HTMLElement;
        const newBobbleContent = {
            message: attredElement?.getAttribute('data-bobble-msg') || undefined,
            icon: attredElement?.getAttribute('data-bobble-icon') || undefined,
            link: attredElement?.getAttribute('data-bobble-link') || undefined
        }

        if (newBobbleContent.message || newBobbleContent.icon) {
            clearTimeout(bobbleClearTimeout);
            // Skip setting bobble if the content is the same as the current bobble
            if (bobble?.message === newBobbleContent.message && bobble?.icon === newBobbleContent.icon) {
                return;
            }
            bobble = newBobbleContent;
        } else if (attredElement?.getAttribute('aria-label') === 'Bobble Message') {
            clearTimeout(bobbleClearTimeout);
        } else {
            clearTimeout(bobbleClearTimeout);
            bobbleClearTimeout = setTimeout(() => {
                bobble = undefined;
            }, 1000);
        }
	};

	$effect(() => {
		document.addEventListener('mouseover', handler);

		return () => document.removeEventListener('mouseover', handler);
	});

    return {
        get current() {
            return bobble; 
        }
    }
};
