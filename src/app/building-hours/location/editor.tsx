import React from 'react'
import {BuildingHoursScheduleEditorView} from '../../../views/building-hours/report/editor'
import {Stack} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {Platform} from 'react-native'

export default function BuildingHoursEditorScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Edit Schedule',
					presentation: 'modal',
					headerRight: () =>
						Platform.OS === 'ios' && <CloseScreenButton />,
				}}
			/>
			<BuildingHoursScheduleEditorView />
		</>
	)
}
