import * as React from 'react'
import {Stack} from 'expo-router'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen name="Streaming Media" options={{title: 'Streaming Media'}} />
			<Stack.Screen name="News" options={{title: 'News', headerLargeTitleEnabled: true}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
			<Stack.Screen name="BuildingHours" />
			<Stack.Screen
				name="BuildingHours/detail"
				options={{
					presentation: 'formSheet',
					headerShown: false,
					sheetAllowedDetents: [0.5, 0.999],
					sheetGrabberVisible: true,
					// 'none' rather than 'last': the list behind has nothing worth
					// touching once the sheet is up, and an undimmed detent lets UIKit
					// pass taps through to it -- a second tap on another row would push
					// a second detail sheet on top of the first.
					sheetLargestUndimmedDetentIndex: 'none',
				}}
			/>
			<Stack.Screen
				name="BuildingHoursProblemReport"
				options={{presentation: 'modal', gestureEnabled: false}}
			/>
			<Stack.Screen name="BuildingHoursScheduleEditor" options={{presentation: 'modal'}} />
			<Stack.Screen name="Communities" />
			<Stack.Screen name="Map" options={{title: 'Carleton Map'}} />
			<Stack.Screen name="SIS" options={{title: 'SIS'}} />
			<Stack.Screen
				name="EventDetail"
				options={{presentation: 'modal', title: '', headerTransparent: true}}
			/>
			<Stack.Screen name="Calendar" options={{title: 'Calendar', headerLargeTitle: true}} />
		</Stack>
	)
}
