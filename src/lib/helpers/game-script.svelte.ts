import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { derived, fromStore } from 'svelte/store';

import { useTypewriter } from '$lib/helpers/typewriter.svelte';
import { m } from '$lib/paraglide/messages.js';
import { useGameStore } from '$lib/store/game';

export const useGameScript = () => {
	const { gameStartSeconds, backButtonClickedTimes } = useGameStore();

	const gameButtonClickedTimesMessageMap = new SvelteMap([
		[1, m.game_mode_description_script_after_back_to_game_1()],
		[2, m.game_mode_description_script_after_back_to_game_2()],
		[3, m.game_mode_description_script_after_back_to_game_3()],
		[4, m.game_mode_description_script_after_back_to_game_4()],
		[5, m.game_mode_description_script_after_back_to_game_5()],
		[6, m.game_mode_description_script_after_back_to_game_6()],
		[7, m.game_mode_description_script_after_back_to_game_7()],
		[10, m.game_mode_description_script_after_back_to_game_10()],
		[100, m.game_mode_description_script_after_back_to_game_100()],
		[999, m.game_mode_description_script_after_back_to_game_999()]
	]);

	const gameButtonClickedTimesMessageRandomSet = new SvelteSet<string>([]);

	const gameDescriptionMessage = derived(backButtonClickedTimes, ($backButtonClickedTimes) => {
		if ($backButtonClickedTimes === 0) {
			return fromStore(gameStartSeconds).current > 10
				? m.game_mode_description_hint_1()
				: m.game_mode_description_default();
		} else {
			for (const [times, message] of gameButtonClickedTimesMessageMap) {
				if ($backButtonClickedTimes === times) {
					if ($backButtonClickedTimes >= 3 && $backButtonClickedTimes <= 10) {
						gameButtonClickedTimesMessageRandomSet.add(message);
					}
					return message;
				}
			}

			const candidate = [...gameButtonClickedTimesMessageRandomSet.values()][
				Math.floor(Math.random() * 3)
			];

			if (gameButtonClickedTimesMessageRandomSet.size > 3) {
				gameButtonClickedTimesMessageRandomSet.delete(candidate);

				setTimeout(() => {
					gameButtonClickedTimesMessageRandomSet.add(candidate);
				}, 3000);
			}

			return candidate;
		}
	});

	const gameBackButtonText = derived(backButtonClickedTimes, ($backButtonClickedTimes) =>
		$backButtonClickedTimes >= 1 ? m.game_back_to_game() : m.pages_error_back_to_home()
	);

	const gameDescription = useTypewriter(() => fromStore(gameDescriptionMessage).current);
	const gameBackButton = useTypewriter(() => fromStore(gameBackButtonText).current, {
		startAt: 12,
		startDelay: 5000,
		baseInterval: 150,
		skipFirst: true
	});

	return {
		gameDescription,
		gameBackButton
	};
};
