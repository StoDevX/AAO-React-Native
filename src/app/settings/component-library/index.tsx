import React from 'react'
import {ComponentLibrary} from '../../../views/settings'
import {Stack} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {Platform} from 'react-native'

export default function ComponentLibraryScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Component Library',
					headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
				}}
			/>
			<ComponentLibrary />
		</>
	)
}
