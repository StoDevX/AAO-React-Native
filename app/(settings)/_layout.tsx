import * as React from 'react'
import {Stack} from 'expo-router'

export default function SettingsLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="Credits" />
			<Stack.Screen name="Privacy" />
			<Stack.Screen name="Legal" />
			<Stack.Screen name="ReportProblem" options={{presentation: 'modal'}} />
			<Stack.Screen name="NetworkLogger" options={{presentation: 'modal', gestureEnabled: false}} />
		</Stack>
	)
}
