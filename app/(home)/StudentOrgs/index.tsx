import * as React from 'react'
import {Stack} from 'expo-router'

import {
	StudentOrgsView,
	NavigationOptions,
} from '../../../source/views/student-orgs'

export default function StudentOrgsPage(): React.ReactNode {
	return (
		<>
			{/* NavigationOptions is still typed against
			    @react-navigation/native-stack's NativeStackNavigationOptions,
			    which source/navigation/routes.tsx no longer references (Step 4)
			    but source/views/student-orgs/list.tsx still exports it with that
			    type for now. expo-router's own Stack.Screen forks a structurally
			    different options type, so this cast bridges the two -- see the
			    design doc's "Findings from PR 1 (More)" section. Goes away once
			    every group has migrated and this type can move to expo-router's
			    own. */}
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<StudentOrgsView />
		</>
	)
}
