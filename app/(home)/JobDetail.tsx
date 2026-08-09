import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {ShareButton} from '@frogpond/navigation-buttons'

import {JobDetailView} from '../../source/views/sis/student-work/detail'
import {jobByIdOptions} from '../../source/views/sis/student-work/query'
import {shareJob} from '../../source/views/sis/student-work/lib'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function JobDetailPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()

	let {data: job, isLoading, error, refetch} = useQuery(jobByIdOptions(jobId))

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!job) {
		return <NoticeView text="Could not find this job posting." />
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: job.title,
					headerRight: () => <ShareButton onPress={() => shareJob(job)} />,
				}}
			/>
			<JobDetailView job={job} />
		</>
	)
}
