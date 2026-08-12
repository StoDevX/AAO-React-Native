import * as React from 'react'
import {Stack, useLocalSearchParams, useNavigation} from 'expo-router'

import {BuildingHoursScheduleEditorView} from '../../source/views/building-hours'

export default function BuildingHoursScheduleEditorPage(): React.ReactNode {
	const navigation = useNavigation()
	let {scheduleIndex, setIndex} = useLocalSearchParams<{
		scheduleIndex: string
		setIndex: string
	}>()

	return (
		<>
			<Stack.Title>Edit Schedule</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<BuildingHoursScheduleEditorView
				scheduleIndex={Number(scheduleIndex)}
				setIndex={Number(setIndex)}
			/>
		</>
	)
}
