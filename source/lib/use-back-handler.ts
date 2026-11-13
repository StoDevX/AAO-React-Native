import * as React from 'react'
import {BackHandler} from 'react-native'
import {useFocusEffect} from 'expo-router'

/**
 * Handles Android's Back (the gesture or button) while `active` and the
 * screen is focused: `onBack` runs and Back goes no further. Otherwise Back
 * does what it would have, usually leaving the screen. iOS has no Back
 * event, so this does nothing there.
 *
 * For state a screen keeps itself that Back should undo first -- a card
 * open over a list, say -- as Android users expect Back to close the
 * innermost thing before leaving.
 */
export function useBackHandler(active: boolean, onBack: () => void): void {
	let latest = React.useRef(onBack)
	React.useEffect(() => {
		latest.current = onBack
	})
	useFocusEffect(
		React.useCallback(() => {
			if (!active) {
				return
			}
			let subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				latest.current()
				return true
			})
			return () => subscription.remove()
		}, [active]),
	)
}
