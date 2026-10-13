import {takePendingResetURL} from '@frogpond/launch-arguments'

import {useRadioStore} from '../source/features/streaming/radio'
import {dismissSheets} from '../source/lib/sheet-dismissal'

/** How long the stack gets to settle after the sheets pop, before the link is routed. */
const DISMISS_SETTLE_MS = 50

/**
 * Runs for every link iOS hands the app, a Home Screen quick action included.
 * A sheet such as Customize or Now Playing would otherwise stay open under
 * the destination, so close the sheets first. Screens pushed on the way stay,
 * so Back from the destination retraces them. A cold launch has nothing open,
 * and the router is not mounted yet.
 *
 * Popping is dispatched, not immediate, and the link is routed as soon as
 * this returns. On a warm app the path comes back late, once the pop has run;
 * routed at once, the destination would open first and leave the sheet under it.
 *
 * After a UI test resets the app in place, the reloaded JavaScript opens the
 * route the test asked for, as a cold launch with that link would. expo-linking
 * would otherwise hand it the link the process was first launched with.
 */
export function redirectSystemPath({
	path,
	initial,
}: {
	path: string
	initial: boolean
}): string | Promise<string> {
	if (initial) {
		return takePendingResetURL() ?? path
	}

	// The radio's player is a sheet of its own, not a route, so the router cannot close it.
	useRadioStore.getState().closeSheet()

	if (!dismissSheets()) {
		return path
	}

	return new Promise((resolve) => {
		setTimeout(() => resolve(path), DISMISS_SETTLE_MS)
	})
}
