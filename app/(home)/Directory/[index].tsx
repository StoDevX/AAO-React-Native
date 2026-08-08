import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {DirectoryDetailView} from '../../../source/views/directory'
import {directoryContactOptions} from '../../../source/views/directory/query'
import type {DirectorySearchTypeEnum} from '../../../source/views/directory/types'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function DirectoryDetailPage(): React.ReactNode {
	let {index, query, type} = useLocalSearchParams<{
		index: string
		query: string
		type: string
	}>()

	let {
		data: contact,
		isLoading,
		error,
		refetch,
	} = useQuery(
		directoryContactOptions(
			query,
			type as DirectorySearchTypeEnum,
			Number(index),
		),
	)

	let screen = (
		<Stack.Screen options={{title: contact?.displayName ?? 'Contact'}} />
	)

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
				<NoticeView text="Could not find this directory entry." />
			</>
		)
	}

	return (
		<>
			{screen}
			<DirectoryDetailView contact={contact} />
		</>
	)
}
