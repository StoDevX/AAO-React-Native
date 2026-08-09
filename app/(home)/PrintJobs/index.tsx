import * as React from 'react'
import {Stack} from 'expo-router'

import {
	PrintJobsView,
	PrintJobsNavigationOptions,
} from '../../../source/views/stoprint'

export default function PrintJobsPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					PrintJobsNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<PrintJobsView />
		</>
	)
}
