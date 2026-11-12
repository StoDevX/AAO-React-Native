import * as React from 'react'
import {Tabs} from 'expo-router/js-tabs'

import {MaterialTabRow, type MaterialTab} from '../../../source/android-ui/tab-row'

/** Convocations' two lists, as Material primary tabs. */
const TABS: ReadonlyArray<MaterialTab> = [
	{name: 'index', title: 'Upcoming'},
	{name: 'archived', title: 'Archives'},
]

/**
 * Upcoming and past convocations as Material primary tabs under the top app
 * bar: two peer views of one destination, which Material draws as tabs rather
 * than as a navigation bar of top-level destinations.
 */
export default function CarletonConvosLayout(): React.ReactNode {
	return (
		<Tabs
			screenOptions={{headerShown: false, tabBarPosition: 'top'}}
			tabBar={(props) => <MaterialTabRow {...props} tabs={TABS} />}
		>
			{TABS.map((tab) => (
				<Tabs.Screen key={tab.name} name={tab.name} options={{title: tab.title}} />
			))}
		</Tabs>
	)
}
