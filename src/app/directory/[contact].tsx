import React from 'react'
import {DirectoryDetailView} from '../../views/directory/detail'
import {Stack} from 'expo-router'

export default function DirectoryDetailScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Contact'}} />
			<DirectoryDetailView />
		</>
	)
}
