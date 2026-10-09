import * as React from 'react'

import {BonAppHostedMenu} from './menu-bonapp'
import {menuTab} from './menu-tabs'

/** A tab's Bon Appétit café, as its campus's definition describes it, wherever it is shown. */
export function TabCafeMenu({name}: {name: string}): React.ReactNode {
	let {server, tab} = menuTab(name)
	if (!tab.bonApp) {
		throw new Error(`Menus' ${name} tab names no Bon Appétit café`)
	}
	return (
		<BonAppHostedMenu
			cafe={tab.bonApp.cafe}
			loadingMessage={tab.bonApp.loadingMessage}
			name={tab.title}
			server={server}
		/>
	)
}
