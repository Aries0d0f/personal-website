// Animates child sections in only once they enter the viewport, staggered per batch.
export const reveal = (el: HTMLElement) => {
	const observer = new IntersectionObserver((entries) => {
		let order = 0;

		for (const entry of entries) {
			if (!entry.isIntersecting) continue;

			const section = entry.target as HTMLElement;
			section.style.animationDelay = `${order++ * 0.05}s`;
			section.classList.add('revealed');
			observer.unobserve(section);
		}
	});

	for (const section of el.querySelectorAll<HTMLElement>(':scope > section')) {
		section.classList.add('reveal');
		observer.observe(section);
	}

	return {
		destroy: () => observer.disconnect()
	};
};
