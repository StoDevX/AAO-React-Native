import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {ContactsDetailView} from '../../../source/views/contacts'
import {contactByTitleOptions} from '../../../source/views/contacts/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function ContactsDetailPage(): React.ReactNode {
	let {title} = useLocalSearchParams<{title: string}>()
	let {data: contact, isLoading} = useQuery(contactByTitleOptions(title))

	if (isLoading) {
		return <LoadingView />
	}

	if (!contact) {
		return <NoticeView text={`Could not find contact "${title}".`} />
	}

	return (
		<>
			<Stack.Screen options={{title: contact.title}} />
			<ContactsDetailView contact={contact} />
		</>
	)
}
