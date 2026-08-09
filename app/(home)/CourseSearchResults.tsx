import * as React from 'react'
import {Stack} from 'expo-router'

import {CourseSearchResultsView} from '../../source/views/sis/course-search/results'

export default function CourseSearchResultsPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Course Catalog'}} />
			<CourseSearchResultsView />
		</>
	)
}
