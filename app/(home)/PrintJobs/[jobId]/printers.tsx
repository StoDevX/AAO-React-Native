import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {PrinterListView} from '../../../../source/views/stoprint'
import {jobByIdOptions} from '../../../../source/views/stoprint/query'
import {credentialsOptions} from '../../../../source/lib/login'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function PrinterListPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()

	let {data: username = '', isLoading: credentialsLoading} = useQuery({
		...credentialsOptions,
		select: (data) => data?.username,
	})

	let {
		data: job,
		isLoading: jobLoading,
		error: jobError,
		refetch: jobRefetch,
	} = useQuery(jobByIdOptions(username, jobId))

	let screen = <Stack.Title>Select Printer</Stack.Title>

	if (credentialsLoading || jobLoading) {
		return (
			<>
				{screen}
				<LoadingView text="Loading…" />
			</>
		)
	}

	if (jobError) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={jobRefetch}
					text={`A problem occured while loading: ${
						jobError instanceof Error ? jobError.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!job) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this print job." />
			</>
		)
	}

	return (
		<>
			{screen}
			<PrinterListView job={job} />
		</>
	)
}
