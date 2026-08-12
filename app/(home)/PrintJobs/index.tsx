import * as React from 'react'
import {Stack} from 'expo-router'

import {PrintJobsView} from '../../../source/views/stoprint'

export default function PrintJobsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Print Jobs</Stack.Title>
			<PrintJobsView />
		</>
	)
}
