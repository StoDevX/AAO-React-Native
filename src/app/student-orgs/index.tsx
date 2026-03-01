import React from 'react'
import {StudentOrgsView} from '../../views/student-orgs/list'
import {Stack} from 'expo-router'

export default function StudentOrgsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Student Orgs'}} />
			<StudentOrgsView />
		</>
	)
}
