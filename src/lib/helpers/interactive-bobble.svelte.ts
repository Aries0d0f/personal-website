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
        const newBobbleContent = {
            message: hoveredElement.getAttribute('data-bobble-msg') || undefined,
            icon: hoveredElement.getAttribute('data-bobble-icon') || undefined,
            link: hoveredElement.getAttribute('data-bobble-link') || undefined
        }
        console.log('Currently hovering:', hoveredElement, 'Bobble:', newBobbleContent);
        if (newBobbleContent.message || newBobbleContent.icon) {
            console.log('Setting bobble content for hovered element:', hoveredElement, 'Bobble:', newBobbleContent);
            clearTimeout(bobbleClearTimeout);
            // Skip setting bobble if the content is the same as the current bobble
            if (bobble?.message === newBobbleContent.message && bobble?.icon === newBobbleContent.icon) {
                console.log('Bobble content is the same as current, skipping update.');
                return;
            }
            bobble = newBobbleContent;
        } else if (hoveredElement.getAttribute('aria-label') === 'Bobble Message') {
            console.log('Hovered over the bobble itself, keeping current bobble content.');
            clearTimeout(bobbleClearTimeout);
        } else {
            console.log('No bobble content found for hovered element:', hoveredElement);
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
