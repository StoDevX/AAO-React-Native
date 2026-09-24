import {LogBox} from 'react-native'
import {isUITesting} from '@frogpond/launch-arguments'

/**
 * Hides LogBox's toasts from a UI-test launch.
 *
 * The toast sits over the bottom of the screen -- the Menus tab bar, the
 * Dictionary's search bar -- so a test that taps there taps the toast instead,
 * and fails for a warning that has nothing to do with it. Fatal errors still
 * show. Only a development bundle has LogBox at all, so this matters to UI
 * tests run against Metro; CI embeds a production bundle.
 */
export function hideLogBoxForUITests(uiTesting: boolean): void {
	if (uiTesting) {
		LogBox.ignoreAllLogs(true)
	}
}

hideLogBoxForUITests(isUITesting)
