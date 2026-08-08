import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {StudentOrgsDetailView} from '../../../source/views/student-orgs'
import {orgByNameOptions} from '../../../source/views/student-orgs/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function StudentOrgsDetailPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {data: org, isLoading, error, refetch} = useQuery(orgByNameOptions(name))

	let screen = <Stack.Screen options={{title: org?.name ?? name}} />

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

	if (!org) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find student org "${name}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<StudentOrgsDetailView org={org} />
		</>
	)
}
