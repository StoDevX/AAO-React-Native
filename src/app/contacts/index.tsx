import React from 'react'
import {ContactsListView} from '../../views/contacts/list'
import {Stack} from 'expo-router'

export default function ContactsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Important Contacts'}} />
			<ContactsListView />
		</>
	)
}
