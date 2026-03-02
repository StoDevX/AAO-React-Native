import React from 'react'
import {PrintJobReleaseView} from '../../views/stoprint/print-release'
import {Stack} from 'expo-router'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'
import {isStoprintMocked} from '../../lib/stoprint'

export default function PrintJobReleaseScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Release Job',
					headerRight: () => (
						<DebugNoticeButton shouldShow={isStoprintMocked} />
					),
				}}
			/>
			<PrintJobReleaseView />
		</>
	)
}
