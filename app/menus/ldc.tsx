import * as React from 'react'
import {LoadingView} from '@frogpond/notice'

import {CarletonCafeMenu} from '../../source/features/menus/carleton-cafe-menu'
import {useHasEverBeenFocused} from '../../source/lib/use-has-ever-been-focused'

export default function CarletonLDCTabPage(): React.ReactNode {
	// As in St. Olaf's Menus: every tab is built when the screen opens, so a
	// hall's menu waits until its tab is first shown.
	let hasBeenFocused = useHasEverBeenFocused()
	return hasBeenFocused ? <CarletonCafeMenu cafe="ldc" /> : <LoadingView />
}
