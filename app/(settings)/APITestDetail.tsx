import * as React from 'react'
import {Stack} from 'expo-router'

import {
	APITestDetailNavigationOptions,
	APITestDetailView,
} from '../../source/views/settings'

export default function APITestDetailPage(): React.ReactNode {
	return (
		<>
			{/* APITestDetailNavigationOptions is {} -- title and headerRight are
			    set dynamically at runtime via useNavigation().setOptions() inside
			    APITestDetailView itself, once the displayName param is known. */}
			<Stack.Screen
				options={
					APITestDetailNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<APITestDetailView />
		</>
	)
}
