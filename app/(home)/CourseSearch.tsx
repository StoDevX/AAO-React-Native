import * as React from 'react'
import {Stack} from 'expo-router'

import {
	CourseSearchView,
	NavigationOptions,
} from '../../source/views/sis/course-search/search'

export default function CourseSearchPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<CourseSearchView />
		</>
	)
}
