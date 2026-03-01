import React from 'react'
import {CourseSearchResultsView} from '../../../views/sis/course-search'
import {Stack} from 'expo-router'

export default function CourseSearchResultsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Course Results'}} />
			<CourseSearchResultsView />
		</>
	)
}
