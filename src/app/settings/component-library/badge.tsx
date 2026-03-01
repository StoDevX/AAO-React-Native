import React from 'react'
import {BadgeLibrary} from '../../../views/settings'
import {Stack} from 'expo-router'

export default function BadgeLibraryScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Badges'}} />
			<BadgeLibrary />
		</>
	)
}
