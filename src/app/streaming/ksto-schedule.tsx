import React from 'react'
import {KSTOScheduleView} from '../../views/streaming/radio/schedule'
import {Stack} from 'expo-router'

export default function KstoScheduleScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'KSTO Schedule'}} />
			<KSTOScheduleView />
		</>
	)
}
