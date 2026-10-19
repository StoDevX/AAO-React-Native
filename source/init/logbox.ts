import {LogBox} from 'react-native'

/**
 * Removes LogBox from every launch.
 *
 * Its toast sits over the bottom of the screen -- a tab bar, the radio's action
 * row -- and a finger aimed at the control under it lands on the toast. Warnings
 * and errors still reach Metro's terminal. Uninstalling leaves LogBox's native
 * warning handler in place, so its toasts are hidden as well.
 */
export function removeLogBox(): void {
	LogBox.uninstall()
	LogBox.ignoreAllLogs(true)
}

removeLogBox()
