import * as React from 'react'
import {Stack} from 'expo-router'
import {
	View as SettingsView,
} from './screens/overview'

export default function SettingsRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Settings'}} />
			<SettingsView />
		</>
	)
}
