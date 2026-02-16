import * as React from 'react'
import {Stack} from 'expo-router'
import {BuildingHoursView} from './list'

export default function BuildingHoursRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Building Hours', headerBackTitle: 'Back'}} />
			<BuildingHoursView />
		</>
	)
}
