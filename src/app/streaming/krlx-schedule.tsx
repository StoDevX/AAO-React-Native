import React from 'react'
import {KRLXScheduleView} from '../../views/streaming/radio/schedule'
import {Stack} from 'expo-router'

export default function KrlxScheduleScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'KRLX Schedule'}} />
			<KRLXScheduleView />
		</>
	)
}
