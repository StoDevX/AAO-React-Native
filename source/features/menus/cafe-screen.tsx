import * as React from 'react'

import {MenuHeaderHost, MenuHeaderProvider} from './menu-header'

/**
 * A cafe's menu on a screen of its own, for the grouped home, where each cafe
 * is a tile rather than a tab. The tabbed Menus route hosts the header in its
 * layout; with no layout here, the screen hosts it itself, which is the same
 * place -- a direct child of the route the stack titles.
 */
export function CafeScreen({children}: {children: React.ReactNode}): React.ReactNode {
	return (
		<MenuHeaderProvider>
			<MenuHeaderHost />
			{children}
		</MenuHeaderProvider>
	)
}
