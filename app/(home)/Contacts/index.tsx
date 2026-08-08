import * as React from 'react'
import {Stack} from 'expo-router'

import {ContactsView, NavigationOptions} from '../../../source/views/contacts'

export default function ContactsPage(): React.ReactNode {
	return (
		<>
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
