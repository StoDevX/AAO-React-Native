import * as React from 'react'
import {Stack} from 'expo-router'
import {KSTOScheduleView} from '../../source/views/streaming'

export default function KSTOSchedulePage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'KSTO Schedule'}} />
			<KSTOScheduleView />
		</>
	)
}
