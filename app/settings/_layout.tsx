import * as React from 'react'
import {Stack} from 'expo-router'

export default function SettingsLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="report-problem" options={{presentation: 'modal'}} />
		</Stack>
	)
}
