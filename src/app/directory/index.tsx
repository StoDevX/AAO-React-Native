import React from 'react'
import {DirectoryView} from '../../views/directory/list'
import {Stack} from 'expo-router'

export default function DirectoryScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Directory'}} />
			<DirectoryView />
		</>
	)
}
