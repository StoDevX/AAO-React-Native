import * as React from 'react'
import {Stack} from 'expo-router'
import {DirectoryView} from './list'

export default function DirectoryRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Directory'}} />
			<DirectoryView />
		</>
	)
}
