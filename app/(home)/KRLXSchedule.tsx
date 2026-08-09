import * as React from 'react'
import {Stack} from 'expo-router'
import {KRLXScheduleView} from '../../source/views/streaming'

export default function KRLXSchedulePage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'KRLX Schedule'}} />
			<KRLXScheduleView />
		</>
	)
}
