import * as React from 'react'
import {Slot} from 'expo-router'

import {MenuHeaderHost, MenuHeaderProvider} from '../../../source/features/menus/menu-header'

export default function MenusLayout(): React.ReactNode {
	return (
		// Each cafe is its own home tile, so this route shows one cafe at a time
		// rather than tabbing between them. The host sits here rather than in each
		// cafe: Expo Router keys a screen's header options by the nearest stack
		// route, which is this one.
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<Slot />
		</MenuHeaderProvider>
	)
}
