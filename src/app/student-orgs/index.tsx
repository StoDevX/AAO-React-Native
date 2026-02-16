import * as React from 'react'
import {Stack} from 'expo-router'
import {View as StudentOrgsView} from './list'

export default function StudentOrgsRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Student Orgs'}} />
			<StudentOrgsView />
		</>
	)
}
