import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { derived, fromStore, get, writable, type Readable } from 'svelte/store';

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

/**
 * A line of the script, still unresolved.
 * Paraglide resolves `m.*()` in runtime based on the current locale.
 */
type ScriptLine = () => string;

export const useGameScript = (options: Options = {}) => {
	const { isFirstStageClear = () => false, onFirstStageClear } = options;

	const {
		lastMessageUpdatedAt,
		lastMessageUpdateSeconds,
		backButtonClickedTimes,
		isCaught,
		hasClicked
	} = useGameStore();
	const { interference, burnOut } = useCRT();

	const caughtCheating = writable<boolean>(get(isCaught));
	const immediateMessageQueue = writable<SvelteSet<ScriptLine>>(new SvelteSet<ScriptLine>([]));

	isCaught.subscribe(($isCaught) => {
		if ($isCaught) caughtCheating.set(true);
	});

	let acknowledgedClicks = get(backButtonClickedTimes);

	backButtonClickedTimes.subscribe(($backButtonClickedTimes) => {
		if ($backButtonClickedTimes === acknowledgedClicks) return;

		acknowledgedClicks = $backButtonClickedTimes;
		caughtCheating.set(false);
	});

	const gameButtonClickedTimesMessageMap = new SvelteMap<number, ScriptLine>([
		[1, m.game_mode_description_script_after_back_to_game_1],
		[2, m.game_mode_description_script_after_back_to_game_2],
		[3, m.game_mode_description_script_after_back_to_game_3],
		[4, m.game_mode_description_script_after_back_to_game_4],
		[5, m.game_mode_description_script_after_back_to_game_5],
		[6, m.game_mode_description_script_after_back_to_game_6],
		[7, m.game_mode_description_script_after_back_to_game_7],
		[10, m.game_mode_description_script_after_back_to_game_10],
		[100, m.game_mode_description_script_after_back_to_game_100],
		[999, m.game_mode_description_script_after_back_to_game_999]
	]);

	const gameButtonClickedTimesMessageRandomSet = new SvelteSet<ScriptLine>([]);

	const RETURNING_SUPPRESSES = [1, 2];
	const isReturningClicker = get(hasClicked);

	const gameDescriptionMessageFromButton = derived<Readable<number>, ScriptLine>(
		backButtonClickedTimes,
		($backButtonClickedTimes) => {
			if ($backButtonClickedTimes === 0) {
				return m.game_mode_description_default;
			} else {
				for (const [times, message] of gameButtonClickedTimesMessageMap) {
					if ($backButtonClickedTimes === times) {
						if (isReturningClicker && RETURNING_SUPPRESSES.includes(times)) {
							gameButtonClickedTimesMessageRandomSet.add(gameButtonClickedTimesMessageMap.get(3)!);
							gameButtonClickedTimesMessageRandomSet.add(gameButtonClickedTimesMessageMap.get(6)!);
							break;
						}

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

				return candidate ?? m.game_mode_description_default;
			}
		}
	);

	const gameBackButtonText = derived<Readable<number>, ScriptLine>(
		backButtonClickedTimes,
		($backButtonClickedTimes) =>
			isReturningClicker || $backButtonClickedTimes >= 1
				? m.game_back_to_game
				: m.pages_error_back_to_home
	);
	const fallbackIndicator = derived(lastMessageUpdateSeconds, ($lastMessageUpdateSeconds) =>
		Math.floor($lastMessageUpdateSeconds / 15)
	);
	const gameDescriptionMessageWithCheating: Readable<ScriptLine> = derived(
		[gameDescriptionMessageFromButton, caughtCheating],
		([$message, $caughtCheating]) => ($caughtCheating ? m.game_mode_description_cheating : $message)
	);
	const gameDescriptionMessage: Readable<ScriptLine> = derived(
		[gameDescriptionMessageWithCheating, immediateMessageQueue],
		([$message, $immediateMessages]) =>
			$immediateMessages.size ? $immediateMessages.values().next().value : $message
	);
	const gameDescriptionMessageWithFallbackHint: Readable<ScriptLine> = derived(
		[gameDescriptionMessage, backButtonClickedTimes, fallbackIndicator],
		([$gameDescriptionMessage, $backButtonClickedTimes, $fallbackIndicator]) =>
			$fallbackIndicator > 1
				? $backButtonClickedTimes > 5
					? [
							m.game_mode_description_hint_4,
							m.game_mode_description_hint_3,
							m.game_mode_description_hint_2
						][Math.floor(Math.random() * 3)]
					: $backButtonClickedTimes > 3
						? [m.game_mode_description_hint_3, m.game_mode_description_hint_2][
								Math.floor(Math.random() * 2)
							]
						: $backButtonClickedTimes > 2
							? m.game_mode_description_hint_2
							: m.game_mode_description_hint_1
				: $gameDescriptionMessage
	);

	const descriptionLine = fromStore(gameDescriptionMessageWithFallbackHint);
	const backButtonLine = fromStore(gameBackButtonText);

	const descriptionText = $derived(descriptionLine.current());
	const backButtonText = $derived(backButtonLine.current());

	const gameDescription = useTypewriter(() => descriptionText);
	const gameBackButton = useTypewriter(() => backButtonText, {
		startAt: () => m.pages_error_back_to_home().length,
		startDelay: 7500,
		baseInterval: 150,
		skipFirst: true
	});

	gameDescriptionMessage.subscribe((message) => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		lastMessageUpdatedAt.set(new Date());

		if (message === get(immediateMessageQueue).values().next().value) {
			setTimeout(() => {
				immediateMessageQueue.update((queue) => {
					queue.delete(message);
					return queue;
				});
			}, 5000);
		}
	});

	const firstStageClearTitleText = useTypewriter(
		() => (isFirstStageClear() ? m.game_mode_stage_1_clear_title() : ''),
		{
			startAt: () => m.pages_error_404_title().length,
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

	const firstStageClearTitle = useGlitch(() => firstStageClearTitleText.current, isFirstStageClear);
	const firstStageClearDescription = useGlitch(
		() => firstStageClearDescriptionText.current,
		isFirstStageClear,
		{
			onComplete: () => void burnOut(() => onFirstStageClear?.())
		}
	);

	const immediateFireMessage = (message: ScriptLine) => {
		console.log('Immediate message fired:', message());
		immediateMessageQueue.update((queue) => {
			queue.add(message);
			return queue;
		});
	};

	$effect(() => {
		if (isFirstStageClear()) {
			setTimeout(() => {
				interference();
			}, 1000);
			setTimeout(() => {
				interference();
			}, 3000);
			setTimeout(() => {
				interference();
			}, 5750);
			setTimeout(() => {
				interference();
			}, 6250);
		}
	});

	return {
		immediateFireMessage,
		gameDescription,
		gameBackButton,
		firstStageClearTitle,
		firstStageClearDescription
	};
};
