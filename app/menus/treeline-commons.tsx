import * as React from 'react'
import {LoadingView} from '@frogpond/notice'

import {TabCafeMenu} from '../../source/features/menus/tab-cafe-menu'
import {useHasEverBeenFocused} from '../../source/lib/use-has-ever-been-focused'

export default function ExampleTreelineCommonsTabPage(): React.ReactNode {
	// As in every campus's Menus: every tab is built when the screen opens, so
	// a hall's menu waits until its tab is first shown.
	let hasBeenFocused = useHasEverBeenFocused()
	return hasBeenFocused ? <TabCafeMenu name="treeline-commons" /> : <LoadingView />
}
