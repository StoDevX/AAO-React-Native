import * as React from 'react'
import {Stack} from 'expo-router'

import {ColorsLibrary} from '../../source/views/settings'

export default function ColorsLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Colors'}} />
			<ColorsLibrary />
		</>
	)
}
