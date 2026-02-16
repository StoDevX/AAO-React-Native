import * as React from 'react'
import {Stack} from 'expo-router'
import {ContactsListView as ContactsView} from './list'

export default function ContactsRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Important Contacts'}} />
			<ContactsView />
		</>
	)
}
