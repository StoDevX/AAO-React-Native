import type {InfiniteData} from '@tanstack/react-query'
import type {PersistedClient} from '@tanstack/react-query-persist-client'
import {groupIssues, ISSUE_PAGE_SIZE, topOf} from './issues'
import {messKeys} from './keys'
import type {LightPost} from '../types'

/** Whether two query keys are the same, part for part. */
function sameKey(a: readonly unknown[], b: readonly unknown[]): boolean {
	return a.length === b.length && a.every((part, index) => part === b[index])
}

/** Whether a query key names one issue's stories. */
function isIssueKey(queryKey: readonly unknown[]): boolean {
	let [root, kind] = messKeys.anyIssue
	return queryKey.length === 4 && queryKey[0] === root && queryKey[1] === kind
}

/** Whether some data is an infinite query's pages. */
function isInfiniteData(data: unknown): data is InfiniteData<unknown, unknown> {
	return (
		typeof data === 'object' &&
		data !== null &&
		'pages' in data &&
		Array.isArray(data.pages) &&
		'pageParams' in data &&
		Array.isArray(data.pageParams)
	)
}

/**
 * Whether a query is the issue list holding pages. A further page that fails leaves the list in an
 * error state, but the pages it loaded still stand, and Top is chosen from them.
 */
export function hasIssuePages(query: {
	queryKey: readonly unknown[]
	state: {data?: unknown}
}): boolean {
	return sameKey(query.queryKey, messKeys.issues) && isInfiniteData(query.state.data)
}

/**
 * The persisted cache with the Mess issues cut down: the issue list keeps its first page, which
 * is all Top needs, and of the issues' stories only Top's stay, Top being the newest regular
 * issue that first page names. Every other issue is fetched again when opened, and a special
 * edition's banner is drawn from the issue list alone.
 */
export function withPersistedIssues(client: PersistedClient): PersistedClient {
	let {queries} = client.clientState
	let list = queries.find((query) => sameKey(query.queryKey, messKeys.issues))
	let data = list?.state.data
	let firstPage = isInfiniteData(data)
		? {pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1)}
		: undefined
	let posts = (firstPage?.pages[0] ?? []) as LightPost[]
	let {top} = topOf(groupIssues(posts, posts.length >= ISSUE_PAGE_SIZE))
	let topKey = top ? messKeys.issue(top.after, top.before) : undefined

	let kept = queries.flatMap((query) => {
		if (isIssueKey(query.queryKey)) {
			return topKey && sameKey(query.queryKey, topKey) ? [query] : []
		}
		if (query === list && firstPage) {
			// The first page loaded; any failure belonged to a later page, which is cut here.
			let state = {...query.state, data: firstPage, status: 'success' as const, error: null}
			return [{...query, state: {...state, fetchFailureCount: 0, fetchFailureReason: null}}]
		}
		return [query]
	})
	return {...client, clientState: {...client.clientState, queries: kept}}
}
