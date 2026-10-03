import * as React from 'react'
import {VStack} from '@expo/ui/swift-ui'
import {id, onAppear} from '@expo/ui/swift-ui/modifiers'
import type {InfiniteData, UseInfiniteQueryResult} from '@tanstack/react-query'
import {PageLoading, PageNotice} from './page-notice'

type Props = {query: UseInfiniteQueryResult<InfiniteData<unknown[]>>}

/**
 * The row at the end of a list that loads a page at a time: it fetches the next page as it comes
 * into view, and takes a new identity with each page, so it fetches again when a page adds too
 * little to push it off the screen. A failed page leaves the loaded rows and offers Try Again in
 * its place; after the last page there is no row.
 */
export function NextPageRow({query}: Props): React.ReactNode {
	let pageCount = query.data?.pages.length ?? 0
	// Any fetch in flight, a refresh too, is left to finish: asking for the next page would
	// cancel it. The row's id carries whether a fetch is in flight, so it appears again, and
	// asks, once that fetch settles.
	let fetchMore = () => (query.isFetching ? undefined : query.fetchNextPage())
	let endId = `page-${pageCount}-${query.isFetching ? 'fetching' : 'settled'}`

	if (query.isFetchNextPageError) {
		return <PageNotice error={query.error} onRetry={() => query.fetchNextPage()} />
	}
	if (!query.hasNextPage) return null
	return (
		// The id wraps the onAppear, so a new page rebuilds the view the onAppear sits on.
		<VStack modifiers={[onAppear(fetchMore), id(endId)]}>
			<PageLoading />
		</VStack>
	)
}
