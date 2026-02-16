import * as React from 'react'
import {Stack} from 'expo-router'
import {PrintJobsView} from './print-jobs'

export default function StoPrintRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Print Jobs'}} />
			<PrintJobsView />
		</>
	)
}
