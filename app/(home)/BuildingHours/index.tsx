import * as React from 'react'
import {BuildingHoursView} from '../../../source/views/building-hours'
import {Stack} from 'expo-router'

export default function BuildingHoursPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Building Hours</Stack.Title>
			<BuildingHoursView />
		</>
	)
}
