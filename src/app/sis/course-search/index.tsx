import * as React from 'react'
import {Stack} from 'expo-router'
import {CourseSearchView} from './search'

export default function CourseSearchRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Course Catalog'}} />
			<CourseSearchView />
		</>
	)
}
