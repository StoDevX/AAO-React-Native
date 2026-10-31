import * as React from 'react'
import {LoadingView} from '@frogpond/notice'

import {TabCafeMenu} from '../../source/features/menus/tab-cafe-menu'
import {useHasEverBeenFocused} from '../../source/lib/use-has-ever-been-focused'

export default function TheCagePage(): React.ReactNode {
	// `NativeTabs` builds every tab the moment Menus opens, so a reader who only
	// wants one cafe pays for all of them. Defer this one until it is actually
	// asked for, behind a spinner rather than nothing: `useIsFocused` trails the
	// native tab switch by a render, and the menu opens on a `LoadingView` of its
	// own, so the reader sees one continuous spinner instead of a blank flash.
	let hasBeenFocused = useHasEverBeenFocused()
	return hasBeenFocused ? <TabCafeMenu name="the-cage" /> : <LoadingView />
}
