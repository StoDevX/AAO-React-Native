import * as React from 'react'
import {Stack} from 'expo-router'

import {
	APITestNavigationOptions,
	APITestView,
} from '../../source/views/settings'

export default function APITestPage(): React.ReactNode {
	return (
		<>
			{/* APITestNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					APITestNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<APITestView />
		</>
	)
}
