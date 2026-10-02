import * as React from 'react'
import {Stack} from 'expo-router'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {refreshIssues} from './issue-screen'
import {IssueUnavailable} from './issue-unavailable'
import {sectionStories} from './lib/shelves'
import {MessPage} from './mess-page'
import {PageLoading, PageNotice} from './page-notice'
import {messIssueOptions} from './query'
import {StoryRows} from './story-list'
import type {MessIssue} from './types'
import {useMessIssue} from './use-mess-issues'

type Props = {issueKey: string; section: string}

/**
 * Every story one issue holds in a section, a row each, opened from the section's shelf on the
 * issue's page, and titled with the section's name.
 */
export function IssueSectionScreen({issueKey, section}: Props): React.ReactNode {
	let queryClient = useQueryClient()
	let {issue, persist, query} = useMessIssue(issueKey)

	if (!issue) {
		return <IssueUnavailable query={query} />
	}

	return (
		<>
			<Stack.Screen options={{title: section}} />
			<MessPage onRefresh={() => refreshIssues(queryClient)}>
				<IssueSectionStories issue={issue} persist={persist} section={section} />
			</MessPage>
		</>
	)
}

type IssueSectionStoriesProps = {issue: MessIssue; persist: boolean; section: string}

/** The section's stories, from the issue's own query, which its page has already loaded. */
function IssueSectionStories({issue, persist, section}: IssueSectionStoriesProps): React.ReactNode {
	let stories = useQuery(messIssueOptions(issue, {persist}))
	if (stories.data === undefined) {
		return stories.isError ? (
			<PageNotice error={stories.error} onRetry={() => stories.refetch()} />
		) : (
			<PageLoading paused={stories.fetchStatus === 'paused'} />
		)
	}
	return <StoryRows stories={sectionStories(stories.data, section)} />
}
