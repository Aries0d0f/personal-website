import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { derived, fromStore } from 'svelte/store';

import { useCRT } from '$lib/helpers/crt.svelte';
import { useGlitch } from '$lib/helpers/glitch.svelte';
import { useTypewriter } from '$lib/helpers/typewriter.svelte';
import { m } from '$lib/paraglide/messages.js';
import { useGameStore } from '$lib/store/game';

interface Options {
	/** Whether the player has cleared stage 1 (i.e. forced the status code to 200). */
	isFirstStageClear?: () => boolean;
	/** Fires once the stage clear text has fully melted down, to hand over to the next stage. */
	onFirstStageClear?: () => void;
}

export const useGameScript = (options: Options = {}) => {
	const { isFirstStageClear = () => false, onFirstStageClear } = options;

	const { lastMessageUpdatedAt, lastMessageUpdateSeconds, backButtonClickedTimes } = useGameStore();
	const { interference, burnOut } = useCRT();

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
			return m.game_mode_description_default();
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
	const fallbackIndicator = derived(lastMessageUpdateSeconds, ($lastMessageUpdateSeconds) =>
		Math.floor($lastMessageUpdateSeconds / 15)
	);
	const gameDescriptionMessageWithFallbackHint = derived(
		[gameDescriptionMessage, backButtonClickedTimes, fallbackIndicator],
		([$gameDescriptionMessage, $backButtonClickedTimes, $fallbackIndicator]) =>
			$fallbackIndicator > 1
				? $backButtonClickedTimes > 5
					? [
							m.game_mode_description_hint_4(),
							m.game_mode_description_hint_3(),
							m.game_mode_description_hint_2()
						][Math.floor(Math.random() * 3)]
					: $backButtonClickedTimes > 3
						? [m.game_mode_description_hint_3(), m.game_mode_description_hint_2()][
								Math.floor(Math.random() * 2)
							]
						: $backButtonClickedTimes > 2
							? m.game_mode_description_hint_2()
							: m.game_mode_description_hint_1()
				: $gameDescriptionMessage
	);
	const gameDescription = useTypewriter(
		() => fromStore(gameDescriptionMessageWithFallbackHint).current
	);
	const gameBackButton = useTypewriter(() => fromStore(gameBackButtonText).current, {
		// Keep the "back to home" label on screen and only rewrite the tail of it.
		startAt: m.pages_error_back_to_home().length,
		startDelay: 7500,
		baseInterval: 150,
		skipFirst: true
	});

	gameDescriptionMessage.subscribe(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		lastMessageUpdatedAt.set(new Date());
	});

	const firstStageClearTitleText = useTypewriter(
		() => (isFirstStageClear() ? m.game_mode_stage_1_clear_title() : ''),
		{
			// Keep the shared prefix of the 404 title on screen and only rewrite the tail of it.
			startAt: m.pages_error_404_title().length,
			baseInterval: 30,
			delayMap: {
				' ': 10,
				'\b': 30,
				'!': 100,
				'！': 100
			}
		}
	);
	const firstStageClearDescriptionText = useTypewriter(
		() => (isFirstStageClear() ? m.game_mode_description_script_stage_1_clear() : ''),
		{
			baseInterval: 10,
			startDelay: 1000,
			delayMap: {
				' ': 10,
				'\n': 100,
				'!': 100,
				'！': 100,
				'、': 100,
				'，': 100
			}
		}
	);

	// The whole page takes the hit the moment the status flips, the same way it did on
	// the way into game mode. The text keeps corrupting from there.
	$effect(() => {
		if (isFirstStageClear()) void interference();
	});

	const firstStageClearTitle = useGlitch(() => firstStageClearTitleText.current, isFirstStageClear);
	const firstStageClearDescription = useGlitch(
		() => firstStageClearDescriptionText.current,
		isFirstStageClear,
		{
			// Once the text is gone, the tube overloads: brighter and brighter under the
			// static until it whites out, and the way home is hidden inside the blowout.
			onComplete: () => void burnOut(() => onFirstStageClear?.())
		}
	);

	return {
		gameDescription,
		gameBackButton,
		firstStageClearTitle,
		firstStageClearDescription
	};
};
