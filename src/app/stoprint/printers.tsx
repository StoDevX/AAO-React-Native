import React from 'react'
import {PrinterListView} from '../../views/stoprint/printers'
import {Stack} from 'expo-router'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'
import {isStoprintMocked} from '../../lib/stoprint'

export default function PrinterListScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Select Printer',
					headerRight: () => (
						<DebugNoticeButton shouldShow={isStoprintMocked} />
					),
				}}
			/>
			<PrinterListView />
		</>
	)
}
