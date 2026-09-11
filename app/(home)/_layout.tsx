import * as React from 'react'
import {Stack} from 'expo-router'

import {SHEET_RESTING_FRACTION} from '../../source/lib/constants'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen name="Streaming Media" options={{title: 'Streaming Media'}} />
			<Stack.Screen name="News" options={{title: 'News', headerLargeTitleEnabled: true}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
			<Stack.Screen name="Campus" />
			<Stack.Screen
				name="Campus/detail"
				options={{
					presentation: 'formSheet',
					headerShown: false,
					// Shared with the campus map's sheet so the two rest at the same
					// height; at a half the hours sat low enough to read as cramped.
					sheetAllowedDetents: [SHEET_RESTING_FRACTION, 0.999],
					sheetGrabberVisible: true,
					// 'none' rather than 'last': the list behind has nothing worth
					// touching once the sheet is up, and an undimmed detent lets UIKit
					// pass taps through to it -- a second tap on another row would push
					// a second detail sheet on top of the first.
					sheetLargestUndimmedDetentIndex: 'none',
				}}
			/>
			<Stack.Screen
				name="Dictionary/entry"
				options={{
					presentation: 'formSheet',
					headerShown: false,
					// The same stops as the campus sheets, so every sheet in the app
					// rests at one height.
					sheetAllowedDetents: [SHEET_RESTING_FRACTION, 0.999],
					sheetGrabberVisible: true,
					// The list behind has nothing worth touching while an entry is up,
					// and an undimmed detent would let a second tap push a second sheet.
					sheetLargestUndimmedDetentIndex: 'none',
				}}
			/>
			<Stack.Screen name="Communities" />
			<Stack.Screen name="Map" />
			<Stack.Screen name="SIS" options={{title: 'SIS'}} />
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
			<Stack.Screen name="Calendar" options={{title: 'Calendar'}} />
		</Stack>
	)
}
