import * as React from 'react'
import {Stack} from 'expo-router'

import {ContactsView} from '../../../source/views/contacts'

export default function ContactsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Important Contacts</Stack.Title>
			<ContactsView />
		</>
	)
}
