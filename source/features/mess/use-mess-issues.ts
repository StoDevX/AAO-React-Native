import * as React from 'react'
import {
	useInfiniteQuery,
	type InfiniteData,
	type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import {groupIssues} from './lib/issues'
import {messIssuesOptions} from './query'
import type {LightPost, MessIssue} from './types'

/** The issue list's query, pages of light posts. */
export type MessIssuesQuery = UseInfiniteQueryResult<InfiniteData<LightPost[]>>

/**
 * The paper's issues, newest first, grouped from the pages loaded so far; undefined until the
 * first page loads.
 */
export function useMessIssues(): {issues: MessIssue[] | undefined; query: MessIssuesQuery} {
	let query = useInfiniteQuery(messIssuesOptions)
	let {data, hasNextPage} = query
	let issues = React.useMemo(
		() => (data === undefined ? undefined : groupIssues(data.pages.flat(), hasNextPage)),
		[data, hasNextPage],
	)
	return {issues, query}
}

/**
 * One issue by its key, undefined until the list loads or when it holds no such issue, and
 * whether its stories are saved for the next launch: only the newest issue's are, as the front
 * page's top tile, whose query every page of that issue shares.
 */
export function useMessIssue(issueKey: string): {
	issue: MessIssue | undefined
	persist: boolean
	query: MessIssuesQuery
} {
	let {issues, query} = useMessIssues()
	let issue = issues?.find((candidate) => candidate.key === issueKey)
	return {issue, persist: issue !== undefined && issues?.[0]?.key === issue.key, query}
}
