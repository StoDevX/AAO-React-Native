import * as React from 'react'
import {Stack} from 'expo-router'

export default function SettingsLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="credits" />
			<Stack.Screen name="privacy" />
			<Stack.Screen name="legal" />
			<Stack.Screen name="quick-actions" />
			<Stack.Screen name="report-problem" options={{presentation: 'modal'}} />
			<Stack.Screen name="network-logger" options={{gestureEnabled: false}} />
		</Stack>
	)
}
