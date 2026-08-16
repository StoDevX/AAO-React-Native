import * as React from 'react'
import {Stack} from 'expo-router'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen name="Streaming Media" options={{title: 'Streaming Media'}} />
			<Stack.Screen name="News" options={{title: 'News'}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
			<Stack.Screen name="BuildingHours" />
			<Stack.Screen
				name="BuildingHoursProblemReport"
				options={{presentation: 'modal', gestureEnabled: false}}
			/>
			<Stack.Screen name="BuildingHoursScheduleEditor" options={{presentation: 'modal'}} />
			<Stack.Screen name="Communities" />
			<Stack.Screen name="Map" options={{title: 'Carleton Map'}} />
			<Stack.Screen name="SIS" options={{title: 'SIS'}} />
			{/* No `headerLargeTitle`: tried and reverted -- see the commit message.
			    Configured here, not from inside the screen, because the route
			    renders `NativeTabs` rather than a plain screen, so there's no
			    screen-level place for the composition API the event detail uses
			    instead. */}
			<Stack.Screen name="Calendar" options={{title: 'Calendar', headerShadowVisible: false}} />
		</Stack>
	)
}
