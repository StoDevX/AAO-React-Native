import * as React from 'react'
import {Stack} from 'expo-router'
import {KRLXScheduleView} from './radio/schedule'

export default function KrlxScheduleRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'KRLX Schedule'}} />
			<KRLXScheduleView />
		</>
	)
}
