import React from 'react'
import {PrintJobsView} from '../../views/stoprint/print-jobs'
import {Stack} from 'expo-router'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'
import {isStoprintMocked} from '../../lib/stoprint'

export default function PrintJobsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Print Jobs',
					headerRight: () => (
						<DebugNoticeButton shouldShow={isStoprintMocked} />
					),
				}}
			/>
			<PrintJobsView />
		</>
	)
}
