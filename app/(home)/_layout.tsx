import * as React from 'react'
import {Stack} from 'expo-router'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen
				name="Streaming Media"
				options={{title: 'Streaming Media'}}
			/>
			<Stack.Screen name="News" options={{title: 'News'}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
			<Stack.Screen name="BuildingHours" />
			<Stack.Screen name="BuildingHoursProblemReport" />
			<Stack.Screen name="BuildingHoursScheduleEditor" />
			<Stack.Screen name="Communities" />
			<Stack.Screen name="SIS" options={{title: 'SIS'}} />
			<Stack.Screen name="Calendar" options={{title: 'Calendar'}} />
		</Stack>
	)
}
