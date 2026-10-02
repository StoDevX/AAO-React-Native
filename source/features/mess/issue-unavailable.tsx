import * as React from 'react'
import {Stack} from 'expo-router'
import {StoryLookupNotice} from './story-lookup-notice'
import type {MessIssuesQuery} from './use-mess-issues'

/**
 * What a page of an issue shows while the issue list loads, when it fails, or when it holds no
 * issue by the key the page was opened with.
 */
export function IssueUnavailable({query}: {query: MessIssuesQuery}): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: ''}} />
			<StoryLookupNotice
				query={{
					data: undefined,
					isPending: query.isPending,
					isLoadingError: query.isLoadingError,
					error: query.error,
					refetch: query.refetch,
				}}
				unavailableText="Issue Unavailable"
			/>
		</>
	)
}
