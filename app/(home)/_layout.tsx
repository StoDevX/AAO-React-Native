import * as React from 'react'
import {Stack} from 'expo-router'
import {VariantPickerButton} from '../../source/views/reddit'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen
				name="Streaming Media"
				options={{title: 'Streaming Media'}}
			/>
			<Stack.Screen name="News" options={{title: 'News'}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
			<Stack.Screen name="BuildingHours" options={{title: 'Building Hours'}} />
			<Stack.Screen
				name="BuildingHoursProblemReport"
				options={{presentation: 'modal', gestureEnabled: false}}
			/>
			<Stack.Screen
				name="BuildingHoursScheduleEditor"
				options={{presentation: 'modal'}}
			/>
			<Stack.Screen
				name="Communities"
				options={{
					title: 'Communities',
					headerRight: () => <VariantPickerButton />,
				}}
			/>
			<Stack.Screen name="SIS" options={{title: 'SIS'}} />
			<Stack.Screen name="Calendar" options={{title: 'Calendar'}} />
		</Stack>
	)
}
