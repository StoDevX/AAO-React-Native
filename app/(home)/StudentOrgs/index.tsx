import * as React from 'react'
import {Stack} from 'expo-router'

import {StudentOrgsView} from '../../../source/views/student-orgs'

export default function StudentOrgsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Student Orgs</Stack.Title>
			<StudentOrgsView />
		</>
	)
}
