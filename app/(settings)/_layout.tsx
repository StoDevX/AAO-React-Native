import * as React from 'react'
import {Stack} from 'expo-router'

export default function SettingsLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="Credits" options={{title: 'Credits'}} />
			<Stack.Screen name="Privacy" options={{title: 'Privacy'}} />
			<Stack.Screen name="Legal" options={{title: 'Legal'}} />
			<Stack.Screen name="ReportProblem" options={{presentation: 'modal'}} />
			<Stack.Screen
				name="NetworkLogger"
				options={{presentation: 'modal', gestureEnabled: false}}
			/>
		</Stack>
	)
}
