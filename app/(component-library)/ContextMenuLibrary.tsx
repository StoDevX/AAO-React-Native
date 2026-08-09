import * as React from 'react'
import {Stack} from 'expo-router'

import {ContextMenuLibrary} from '../../source/views/settings'

export default function ContextMenuLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Context Menus'}} />
			<ContextMenuLibrary />
		</>
	)
}
