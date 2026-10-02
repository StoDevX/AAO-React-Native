import {useState} from 'react'
import {useIsFocused} from 'expo-router'

// True once the screen has been focused, and true from then on.
//
// `NativeTabs` mounts every tab's children as soon as the navigator appears:
// one tap on Menus builds all four cafes, and the three the reader did not ask
// for account for the bulk of it. Gating a tab's contents on this hook defers
// that work until the tab is actually opened.
//
// Latched rather than tracking focus directly, because a tab that tore itself
// down on blur would rebuild from scratch on every activation -- trading one
// wasted mount for an unbounded number of them.
export const useHasEverBeenFocused = (): boolean => {
	const isFocused = useIsFocused()
	const [hasBeenFocused, setHasBeenFocused] = useState(isFocused)

	// Set during render rather than in an effect: an effect would let one frame
	// of the empty placeholder reach the screen before the contents mount.
	if (isFocused && !hasBeenFocused) {
		setHasBeenFocused(true)
	}

	return hasBeenFocused || isFocused
}
