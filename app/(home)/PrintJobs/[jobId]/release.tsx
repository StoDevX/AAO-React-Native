import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {
	PrintJobReleaseView,
	PrintJobReleaseNavigationOptions,
} from '../../../../source/views/stoprint'
import {
	jobByIdOptions,
	printerByNameOptions,
} from '../../../../source/views/stoprint/query'
import {credentialsOptions} from '../../../../source/lib/login'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function PrintJobReleasePage(): React.ReactNode {
	let {jobId, printer: printerName} = useLocalSearchParams<{
		jobId: string
		printer?: string
	}>()

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

	let {
		data: printer,
		isLoading: printerLoading,
		error: printerError,
		refetch: printerRefetch,
	} = useQuery(printerByNameOptions(username, printerName))

	let screen = (
		<Stack.Screen
			options={
				PrintJobReleaseNavigationOptions as React.ComponentProps<
					typeof Stack.Screen
				>['options']
			}
		/>
	)

	if (credentialsLoading || jobLoading || printerLoading) {
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

	if (printerName !== undefined && printerError) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={printerRefetch}
					text={`A problem occured while loading: ${
						printerError instanceof Error
							? printerError.message
							: 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (printerName !== undefined && !printer) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this printer." />
			</>
		)
	}

	return (
		<>
			{screen}
			<PrintJobReleaseView job={job} printer={printer} />
		</>
	)
}
