import React from 'react'
import {NetworkLoggerView} from '../../views/settings'
import {Stack} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {Platform} from 'react-native'

export default function NetworkLoggerScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Network Logger',
					headerRight: () =>
						Platform.OS === 'ios' && <CloseScreenButton />,
					presentation: 'modal',
					gestureEnabled: false,
				}}
			/>
			<NetworkLoggerView />
		</>
	)
}
