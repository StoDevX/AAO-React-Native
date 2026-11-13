import * as React from 'react'
import {Tabs} from 'expo-router/js-tabs'

import type {CampusId} from '../../campuses'
import {MaterialTabRow} from '../../android-ui/tab-row'
import {MenuHeaderHost, MenuHeaderProvider} from './menu-header'
import {cafeTabsOf} from './menu-tabs'

/**
 * `campus`'s cafés as Material primary tabs under the top app bar. They are
 * peer views of one destination, Menus, which Material draws as tabs; a
 * navigation bar is for an app's top-level destinations. Only the campus's
 * cafés get a tab, and the first is listed first so the bare path lands on it.
 */
export function CafeTabs({campus}: {campus: CampusId}): React.ReactNode {
	let tabs = cafeTabsOf(campus).map((tab) => ({name: tab.name, title: tab.title}))
	return (
		// As on iOS, the header host sits above the tabs: the stack above reads
		// the header options it publishes, which a tab's own route would not.
		<MenuHeaderProvider>
			<MenuHeaderHost />
			<Tabs
				screenOptions={{headerShown: false, tabBarPosition: 'top'}}
				tabBar={(props) => <MaterialTabRow {...props} tabs={tabs} />}
			>
				{tabs.map((tab) => (
					<Tabs.Screen key={tab.name} name={tab.name} options={{title: tab.title}} />
				))}
			</Tabs>
		</MenuHeaderProvider>
	)
}
