import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'

import {BuildingHoursScheduleEditorView} from '../../source/views/building-hours'

export default function BuildingHoursScheduleEditorPage(): React.ReactNode {
	let {scheduleIndex, setIndex} = useLocalSearchParams<{
		scheduleIndex: string
		setIndex: string
	}>()

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Edit Schedule',
					presentation: 'modal',
					headerRight: () => <CloseScreenButton />,
				}}
			/>
			<BuildingHoursScheduleEditorView
				scheduleIndex={Number(scheduleIndex)}
				setIndex={Number(setIndex)}
			/>
		</>
	)
}
