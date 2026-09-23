import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Markdown} from '@frogpond/markdown'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {jobDetailOptions} from '@frogpond/ccc-jobs'
import {JOB_DESCRIPTION_TITLE} from '../../source/features/sis/student-work/lib'

const styles = StyleSheet.create({
	screen: {
		backgroundColor: c.systemBackground,
	},
	body: {
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
})

/// A posting's description on a screen of its own, reached from its detail
/// screen. The query is the one that screen already ran, so this reads it from
/// the cache rather than fetching again.
export default function JobDescriptionPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()
	let {data: job, isLoading, error} = useQuery(jobDetailOptions(jobId))

	if (isLoading) {
		return (
			<>
				<Stack.Title>{JOB_DESCRIPTION_TITLE}</Stack.Title>
				<LoadingView />
			</>
		)
	}

	if (error || !job) {
		return (
			<>
				<Stack.Title>{JOB_DESCRIPTION_TITLE}</Stack.Title>
				<NoticeView text="Could not load this job posting's description." />
			</>
		)
	}

	return (
		<>
			<Stack.Title>{JOB_DESCRIPTION_TITLE}</Stack.Title>
			<ScrollView
				contentContainerStyle={styles.body}
				contentInsetAdjustmentBehavior="automatic"
				style={styles.screen}
			>
				<Markdown source={job.body} />
			</ScrollView>
		</>
	)
}
