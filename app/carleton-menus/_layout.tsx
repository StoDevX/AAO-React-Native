import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

import {CARLETON_CAFES} from '../../source/features/menus/carleton-cafes'
import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'

/** The tab each hall's menu sits under: Burton's is the first, the index. */
const TAB_NAMES = {
	burton: 'index',
	ldc: 'ldc',
	weitz: 'weitz',
	sayles: 'sayles',
	schulze: 'schulze',
} as const

/** Carleton's Menus tile: a tab per dining hall, as St. Olaf's Menus has a tab per café. */
export default function CarletonMenusLayout(): React.ReactNode {
	return (
		// The host sits here rather than in each tab, as in St. Olaf's Menus: a
		// tab's own header options never reach the stack above it.
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<NativeTabs>
				{CARLETON_CAFES.map((hall) => (
					<NativeTabs.Trigger key={hall.cafe} name={TAB_NAMES[hall.cafe]}>
						<NativeTabs.Trigger.Icon sf={hall.icon} />
						<NativeTabs.Trigger.Label>{hall.title}</NativeTabs.Trigger.Label>
					</NativeTabs.Trigger>
				))}
			</NativeTabs>
		</MenuHeaderProvider>
	)
}
