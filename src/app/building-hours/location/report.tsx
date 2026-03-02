import React from 'react'
import {BuildingHoursProblemReportView} from '../../../views/building-hours/report/overview'
import {Stack} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {Platform} from 'react-native'

export default function BuildingHoursReportScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Report a Problem',
					presentation: 'modal',
					headerRight: () =>
						Platform.OS === 'ios' && <CloseScreenButton title="Discard" />,
					gestureEnabled: false,
				}}
			/>
			<BuildingHoursProblemReportView />
		</>
	)
}
