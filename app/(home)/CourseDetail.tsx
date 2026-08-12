import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {CourseDetailView} from '../../source/views/sis/course-search/detail'
import {
	courseByIdOptions,
	termByNumberOptions,
} from '../../source/views/sis/course-search/query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import type {TermType} from '../../source/lib/course-search'

const PENDING_TERM: TermType = {hash: '', path: '', term: 0, type: '', year: 0}

export default function CourseDetailPage(): React.ReactNode {
	let {clbid, term} = useLocalSearchParams<{clbid: string; term: string}>()

	let {data: resolvedTerm, isLoading: termLoading} = useQuery(
		termByNumberOptions(Number(term)),
	)

	let {
		data: course,
		isLoading: courseLoading,
		error,
		refetch,
	} = useQuery({
		...courseByIdOptions(resolvedTerm ?? PENDING_TERM, Number(clbid)),
		enabled: Boolean(resolvedTerm),
	})

	if (termLoading || courseLoading) {
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

	if (!course) {
		return <NoticeView text="Could not find this course." />
	}

	return (
		<>
			<Stack.Screen options={{title: course.name}} />
			<CourseDetailView course={course} />
		</>
	)
}
