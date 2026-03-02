import React from 'react'
import {SettingsView} from '../../views/settings'
import {Stack} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {Platform} from 'react-native'

export default function SettingsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Settings',
					headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
				}}
			/>
			<SettingsView />
		</>
	)
}
