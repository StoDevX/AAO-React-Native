import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

import type {CampusId} from '../../campuses'
import {MenuHeaderHost, MenuHeaderProvider} from './menu-header'
import {cafeTabsOf} from './menu-tabs'

/**
 * A tab bar of `campus`'s cafés. Only its cafés are triggers, so a café file
 * of another campus beside them is outside the navigator and can't be opened
 * here. The navigator opens on the first trigger, so the folder's bare path
 * lands on the campus's first café.
 */
export function CafeTabs({campus}: {campus: CampusId}): React.ReactNode {
	return (
		// The host sits here rather than in each tab: Expo Router keys a
		// screen's header options by the nearest route, and inside a tab that
		// is the tab's own -- the stack above never sees them.
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<NativeTabs>
				{cafeTabsOf(campus).map((tab) => (
					<NativeTabs.Trigger key={tab.name} name={tab.name}>
						<NativeTabs.Trigger.Icon sf={tab.icon} />
						<NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
					</NativeTabs.Trigger>
				))}
			</NativeTabs>
		</MenuHeaderProvider>
	)
}
