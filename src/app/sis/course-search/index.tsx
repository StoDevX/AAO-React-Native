import React from 'react'
import {CourseSearchView} from '../../../views/sis/course-search'
import {Stack} from 'expo-router'

export default function CourseSearchScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Course Search'}} />
			<CourseSearchView />
		</>
	)
}
