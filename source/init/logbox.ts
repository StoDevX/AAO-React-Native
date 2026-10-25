import {LogBox} from 'react-native'

/**
 * Hides LogBox's toasts on every launch.
 *
 * Its toast sits over the bottom of the screen -- a tab bar, the radio's action
 * row -- and a finger aimed at the control under it lands on the toast. Warnings
 * and errors still reach Metro's terminal, and an uncaught error still gets
 * LogBox's full error screen: uninstalling LogBox would drop that too.
 */
export function removeLogBox(): void {
	LogBox.ignoreAllLogs(true)
}

removeLogBox()
