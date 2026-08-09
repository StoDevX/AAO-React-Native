import * as React from 'react'
import {Stack} from 'expo-router'

import {View as FaqView, NavigationOptions} from '../../source/views/faqs'

export default function FaqPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<FaqView />
		</>
	)
}
