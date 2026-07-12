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

	const gameDescriptionMessage = derived<Readable<number>, ScriptLine>(
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
	const fallbackHintInputs: [Readable<ScriptLine>, Readable<number>, Readable<number>] = [
		gameDescriptionMessage,
		backButtonClickedTimes,
		fallbackIndicator
	];
	const gameDescriptionMessageWithFallbackHint = derived<typeof fallbackHintInputs, ScriptLine>(
		fallbackHintInputs,
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

	// Outranks the hints: being caught is the more interesting thing that just happened,
	// and a hint about looking around would be a strange thing to say to someone who was
	// just dragged back through the door.
	const cheatingInputs: [Readable<ScriptLine>, Readable<boolean>] = [
		gameDescriptionMessageWithFallbackHint,
		caughtCheating
	];
	const gameDescriptionMessageWithCheating = derived<typeof cheatingInputs, ScriptLine>(
		cheatingInputs,
		([$message, $caughtCheating]) => ($caughtCheating ? m.game_mode_description_cheating : $message)
	);

	const descriptionLine = fromStore(gameDescriptionMessageWithCheating);
	const backButtonLine = fromStore(gameBackButtonText);

	// Resolved to text here, and *deliberately* through `$derived`, which is what stops
	// the typewriter re-animating a line it is already showing.
	//
	// These stores carry `m.*` functions rather than strings, so that a locale switch
	// re-resolves them. But a Svelte store treats every function value as changed (that
	// is what `safe_not_equal` does with a function), and `fromStore` invalidates on
	// every notification without comparing. So each click re-notified with the identical
	// message, the typewriter's effect re-ran, and the back button re-played its
	// "Back to Home" → "Back to Game" edit every single time.
	//
	// `$derived` compares its own value: same string, no invalidation, no re-run. The
	// animation now fires when the words actually change, and locale switches still get
	// through because a new locale yields a different string.
	const descriptionText = $derived(descriptionLine.current());
	const backButtonText = $derived(backButtonLine.current());

	const gameDescription = useTypewriter(() => descriptionText);
	const gameBackButton = useTypewriter(() => backButtonText, {
		startAt: () => m.pages_error_back_to_home().length,
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

	const firstStageClearTitle = useGlitch(() => firstStageClearTitleText.current, isFirstStageClear);
	const firstStageClearDescription = useGlitch(
		() => firstStageClearDescriptionText.current,
		isFirstStageClear,
		{
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
