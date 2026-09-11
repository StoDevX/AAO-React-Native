import * as React from 'react'
import {Stack} from 'expo-router'

import {SHEET_RESTING_FRACTION} from '../../source/lib/constants'

/**
 * How every detail sheet in the app presents: a building's hours, a dictionary
 * entry, an Important Contact. One object rather than one per route, so the
 * screens cannot drift apart — two sheets stopping at different heights, or
 * dimming differently, reads as an accident rather than a decision.
 *
 * `headerShown: false` because each of these routes nests a stack of its own
 * to draw its header inside the sheet. A header drawn by this stack instead is
 * a translucent large title with no opaque backing, so within a form sheet its
 * blur samples through and paints whatever sits behind the sheet across the
 * title.
 *
 * `sheetLargestUndimmedDetentIndex: 'none'` rather than `'last'`: whatever is
 * behind has nothing worth touching while a sheet is up, and an undimmed
 * detent lets UIKit pass taps through to it — a second tap on another row or
 * tile would push a second sheet on top of the first.
 *
 * The upper detent is a shade under 1 so the sheet keeps the inset that tells
 * a reader it is a sheet at all.
 */
const DETAIL_SHEET: React.ComponentProps<typeof Stack.Screen>['options'] = {
	presentation: 'formSheet',
	headerShown: false,
	sheetAllowedDetents: [SHEET_RESTING_FRACTION, 0.999],
	sheetGrabberVisible: true,
	sheetLargestUndimmedDetentIndex: 'none',
}

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen name="Streaming Media" options={{title: 'Streaming Media'}} />
			<Stack.Screen name="News" options={{title: 'News', headerLargeTitleEnabled: true}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
			<Stack.Screen name="Campus" />
			<Stack.Screen name="Campus/detail" options={DETAIL_SHEET} />
			<Stack.Screen name="Dictionary/entry" options={DETAIL_SHEET} />
			<Stack.Screen name="Directory/named" options={DETAIL_SHEET} />
			<Stack.Screen name="Communities" />
			<Stack.Screen name="Map" />
			<Stack.Screen name="SIS" options={{title: 'SIS'}} />
			<Stack.Screen
				name="EventDetail"
				options={{presentation: 'modal', title: '', headerTransparent: true}}
			/>
			<Stack.Screen name="Calendar" options={{title: 'Calendar', headerLargeTitle: true}} />
		</Stack>
	)
}
