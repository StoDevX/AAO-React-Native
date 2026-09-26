import * as React from 'react'
import {Stack} from 'expo-router'

import {SHEET_RESTING_FRACTION} from '../../source/lib/constants'

/**
 * How every detail sheet in the app presents: a building's hours, a dictionary
 * entry, an Important Contact, a dish's nutrition. One object rather than one
 * per route, so the screens cannot drift apart — two sheets stopping at
 * different heights, or dimming differently, reads as an accident rather than
 * a decision.
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
			<Stack.Screen name="MenuItemDetail" options={DETAIL_SHEET} />
			<Stack.Screen name="Streaming Media" options={{title: 'Streaming Media'}} />
			<Stack.Screen
				name="Messenger"
				options={{title: 'The Olaf Messenger', headerLargeTitleEnabled: true}}
			/>
			<Stack.Screen
				name="StOlafNews"
				options={{title: 'St. Olaf News', headerLargeTitleEnabled: true}}
			/>
			<Stack.Screen name="Transit" options={{title: 'Transit'}} />
			<Stack.Screen name="Transit/line" options={DETAIL_SHEET} />
			<Stack.Screen name="Hours" />
			<Stack.Screen name="Hours/detail" options={DETAIL_SHEET} />
			<Stack.Screen name="Dictionary/entry" options={DETAIL_SHEET} />
			{/* A department opens a fresh copy of the Directory over the landing.
			    Keyed by the search it shows, navigating to a different one pushes
			    it, where an unkeyed route would only swap the params of the
			    Directory already on top; navigating to the same one still
			    refuses a duplicate. */}
			<Stack.Screen
				dangerouslySingular={(_name, params) =>
					`${params.queryType ?? ''}:${params.queryParam ?? ''}`
				}
				name="Directory/index"
			/>
			<Stack.Screen name="Directory/named" options={DETAIL_SHEET} />
			<Stack.Screen name="Map" />
			<Stack.Screen name="SIS/index" options={{title: 'SIS'}} />
			<Stack.Screen
				name="EventDetail"
				options={{
					// A form sheet rather than a modal. As a modal, two quick presses
					// of Close popped twice -- the dismissal and the press each taking
					// a screen -- and landed on the home screen. A form sheet dismisses
					// itself, so the grabber is the way out and there is no button to
					// press twice.
					presentation: 'formSheet',
					title: '',
					headerTransparent: true,
					// The same stops as the campus and dictionary sheets, so every
					// sheet in the app rests at one height.
					sheetAllowedDetents: [SHEET_RESTING_FRACTION, 0.999],
					sheetGrabberVisible: true,
					// The calendar behind has nothing worth touching while an event is
					// up, and an undimmed detent would let a second tap push a second
					// sheet on top of the first.
					sheetLargestUndimmedDetentIndex: 'none',
				}}
			/>
			<Stack.Screen name="Calendar" options={{title: 'Calendar', headerLargeTitleEnabled: true}} />
		</Stack>
	)
}
