import * as React from 'react'
import {usePathname} from 'expo-router'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

import {useCampusId} from '../../source/features/campus/store'
import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'
import {MENU_TABS, menuCampusOf} from '../../source/features/menus/menu-tabs'
import {requiresSection} from '../../source/features/campus/section-gate'

function MenusLayout(): React.ReactNode {
	// The tab bar shows one campus's cafés: those of the campus whose tab is
	// open. Each campus's Menus tile opens on its own first café.
	let campus = menuCampusOf(usePathname(), useCampusId())

	return (
		// The host sits here rather than in each tab: Expo Router keys a
		// screen's header options by the nearest route, and inside a tab that
		// is the tab's own -- the stack above never sees them.
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<NativeTabs>
				{MENU_TABS.map(({campus: owner, tab}) => (
					<NativeTabs.Trigger key={tab.name} hidden={owner !== campus} name={tab.name}>
						<NativeTabs.Trigger.Icon sf={tab.icon} />
						<NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
					</NativeTabs.Trigger>
				))}
			</NativeTabs>
		</MenuHeaderProvider>
	)
}

export default requiresSection(
	'menus',
	{title: 'Menus', noun: 'dining menus', systemImage: 'fork.knife'},
	MenusLayout,
)
