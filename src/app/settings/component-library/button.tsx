import React from 'react'
import {ButtonLibrary} from '../../../views/settings'
import {Stack} from 'expo-router'

export default function ButtonLibraryScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Buttons'}} />
			<ButtonLibrary />
		</>
	)
}
