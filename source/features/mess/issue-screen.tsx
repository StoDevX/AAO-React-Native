import * as React from 'react'
import {Stack} from 'expo-router'
import {useQueryClient} from '@tanstack/react-query'
import {OLAF_MESSENGER} from '../news/sources'
import {useNewsFilterStore} from '../news/store'
import {IssuePage} from './issue-page'
import {chipKey} from './lib/chips'
import {issueDate} from './lib/issues'
import {messKeys} from './lib/keys'
import {MessPage, PAGE_MARGIN} from './mess-page'
import {StoryLookupNotice} from './story-lookup-notice'
import {useColumnWidth} from './use-column-width'
import {useMessIssues} from './use-mess-issues'
import {useDismissOnce} from '../../lib/use-dismiss-once'

/** One issue, opened from the Issues list, laid out as Top lays out the newest, and titled with its date. */
export function IssueScreen({day}: {day: string}): React.ReactNode {
	let goBack = useDismissOnce()
	let queryClient = useQueryClient()
	let select = useNewsFilterStore((state) => state.select)
	let columnWidth = useColumnWidth(PAGE_MARGIN)
	let {issues, query} = useMessIssues()
	let issue = issues?.find((candidate) => candidate.day === day)

	if (!issue) {
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
					unavailableText="Issue unavailable"
				/>
			</>
		)
	}

	let {after, before} = issue
	// "All ›" shows that section on the front page, which is the screen under this one.
	let showSection = (name: string) => {
		select(OLAF_MESSENGER.id, chipKey({kind: 'section', name}))
		goBack()
	}

	return (
		<>
			<Stack.Screen options={{title: issueDate(issue.day)}} />
			<MessPage
				onRefresh={() => queryClient.refetchQueries({queryKey: messKeys.issue(after, before)})}
			>
				<IssuePage
					columnWidth={columnWidth}
					issue={issue}
					onShowSection={showSection}
					showMasthead={false}
				/>
			</MessPage>
		</>
	)
}
