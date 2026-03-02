import React from 'react'
import {ContextMenuLibrary} from '../../../views/settings'
import {Stack} from 'expo-router'

export default function ContextMenuLibraryScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Context Menus'}} />
			<ContextMenuLibrary />
		</>
	)
}
