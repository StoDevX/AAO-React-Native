import * as React from 'react'
import {Stack} from 'expo-router'

import {View, NavigationOptions} from '../../../source/views/more'

export default function MorePage(): React.ReactNode {
	return (
		<>
			{/* NavigationOptions is still typed against @react-navigation/native-stack
			    because source/navigation/routes.tsx also consumes it (until checkpoint 7
			    deletes that file); expo-router's Stack.Screen expects its own forked --
			    structurally incompatible -- NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<View />
		</>
	)
}
