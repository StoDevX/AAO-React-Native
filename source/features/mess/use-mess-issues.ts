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
