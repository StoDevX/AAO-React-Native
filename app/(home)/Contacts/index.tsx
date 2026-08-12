import * as React from 'react'
import {Stack} from 'expo-router'

import {ContactsView, NavigationOptions} from '../../../source/views/contacts'

export default function ContactsPage(): React.ReactNode {
	return (
		<>
			{/* NavigationOptions is still typed as @react-navigation/native-stack's
			    NativeStackNavigationOptions -- the shape every group's list/detail
			    screens use until checkpoint 7 retires source/navigation/routes.tsx
			    entirely; expo-router's Stack.Screen expects its own forked --
			    structurally incompatible -- options type, hence the cast. */}
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<ContactsView />
		</>
	)
}
