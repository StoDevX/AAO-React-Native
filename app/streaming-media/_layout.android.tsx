import * as React from 'react'
import {Tabs} from 'expo-router/js-tabs'

import {MaterialTabRow, type MaterialTab} from '../../source/android-ui/tab-row'
import {requiresSection} from '../../source/features/campus/section-gate'

/** Streaming Media's two lists, as Material primary tabs. */
const TABS: ReadonlyArray<MaterialTab> = [
	{name: 'index', title: 'Streaming'},
	{name: 'webcams', title: 'Webcams'},
]

/**
 * Streams and webcams as Material primary tabs under the top app bar: two
 * peer views of one destination, which Material draws as tabs rather than as
 * a navigation bar of top-level destinations.
 */
function StreamingMediaLayout(): React.ReactNode {
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

export default requiresSection(
	'streaming',
	{title: 'Streaming Media', noun: 'webcams or streams', systemImage: 'video'},
	StreamingMediaLayout,
)
