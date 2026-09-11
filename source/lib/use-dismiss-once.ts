import * as React from 'react'
import {useNavigation} from 'expo-router'

/**
 * Leaves the screen, and does nothing if asked again.
 *
 * A sheet or a modal on its way out still draws its close button, and a
 * second press while the first dismissal is in flight goes back twice --
 * off the sheet and off the screen behind it. A lagging screen invites
 * exactly that second press.
 *
 * The latch is a ref rather than state: a re-render must not clear it while
 * the dismissal is still travelling. It never needs resetting, because the
 * screen it belongs to is gone by then.
 *
 * Which is also the one place not to use this. A screen guarded by
 * `usePreventRemove` -- the unsaved-changes alert on the problem report and
 * the dictionary editor -- can refuse to go. Latching there would swallow the
 * second, entirely legitimate press after someone cancels the alert, and
 * strand them on a screen whose back button had stopped working.
 */
export function useDismissOnce(): () => void {
	let navigation = useNavigation()
	let dismissing = React.useRef(false)

	return React.useCallback(() => {
		if (dismissing.current) {
			return
		}

		dismissing.current = true
		navigation.goBack()
	}, [navigation])
}
