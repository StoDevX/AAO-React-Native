import * as React from 'react'
import {Stack} from 'expo-router'
import {KSTOScheduleView} from './radio/schedule'

export default function KstoScheduleRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'KSTO Schedule'}} />
			<KSTOScheduleView />
		</>
	)
}
