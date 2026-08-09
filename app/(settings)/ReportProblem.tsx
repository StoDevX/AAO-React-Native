import * as React from 'react'
import {Stack} from 'expo-router'

import {
	ReportProblemView,
	ReportProblemNavigationOptions,
} from '../../source/views/settings'

export default function ReportProblemPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					ReportProblemNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<ReportProblemView />
		</>
	)
}
