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
			{/* `pageSheet` rather than the `modal` the rest of this layout uses.
			    `RNSScreen.mm` maps `modal` to `UIModalPresentationAutomatic` and only
			    `pageSheet` to `UIModalPresentationPageSheet`. UIKit resolves automatic to
			    a page sheet on iPhone today, so the two look alike -- but the inset card
			    Calendar.app uses is worth stating outright rather than inheriting.
			    `title: ''` is defined-but-empty, so react-navigation uses it rather
			    than falling back to the route filename -- the sheet already carries
			    the event's name in its body, so a bar title would state it twice. */}
			<Stack.Screen
				name="EventDetail"
				options={{presentation: 'pageSheet', title: '', headerTransparent: true}}
			/>
			{/* `headerLargeTitle` collides with a tab bar under the header. This
			    screen has none, so it behaves: verified on the simulator that the
			    title collapses into the bar on scroll. */}
			<Stack.Screen name="Calendar" options={{title: 'Calendar', headerLargeTitle: true}} />
		</Stack>
	)
}
