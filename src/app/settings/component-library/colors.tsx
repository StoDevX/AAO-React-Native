import React from 'react'
import {ColorsLibrary} from '../../../views/settings'
import {Stack} from 'expo-router'

export default function ColorsLibraryScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Colors'}} />
			<ColorsLibrary />
		</>
	)
}
