import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {ContactsDetailView} from '../../../source/views/contacts'
import {contactByTitleOptions} from '../../../source/views/contacts/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function ContactsDetailPage(): React.ReactNode {
	let {title} = useLocalSearchParams<{title: string}>()
	let {
		data: contact,
		error,
		isLoading,
		refetch,
	} = useQuery(contactByTitleOptions(title))

	// Set from the route param immediately, then from the resolved contact
	// once it loads -- so the header never falls back to the raw route name
	// while loading, erroring, or failing to find the contact.
	let screen = <Stack.Screen options={{title: contact?.title ?? title}} />

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!contact) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find contact "${title}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<ContactsDetailView contact={contact} />
		</>
	)
}
