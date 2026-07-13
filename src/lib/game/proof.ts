const SEGMENT_COUNT = 8;
const SEGMENT_LENGTH = 8;

export function computeStageProof(seedHex: string, stage: number, startedAt: number): string {
	const segments: string[] = [];
	for (let i = 0; i < SEGMENT_COUNT; i++) {
		segments.push(seedHex.slice(i * SEGMENT_LENGTH, (i + 1) * SEGMENT_LENGTH));
	}

	const started = new Date(startedAt);
	const weekday = started.getUTCDay(); // Sun = 0 ... Sat = 6
	const index = (stage + weekday) % SEGMENT_LENGTH;

	const code = segments.map((segment) => segment[index]).join('');
	const startedBeforeNoon = started.getUTCHours() < 12;

	return startedBeforeNoon ? code : code.split('').reverse().join('');
}
