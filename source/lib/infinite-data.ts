import type {InfiniteData, QueryClient, QueryKey} from '@tanstack/react-query'

/** Whether some data is an infinite query's pages. */
export function isInfiniteData(data: unknown): data is InfiniteData<unknown, unknown> {
	return (
		typeof data === 'object' &&
		data !== null &&
		'pages' in data &&
		Array.isArray(data.pages) &&
		'pageParams' in data &&
		Array.isArray(data.pageParams)
	)
}

/** An infinite query's pages cut to its first `count`; later pages load again as they are reached. */
export function firstPagesOf<T>(
	data: InfiniteData<T, unknown>,
	count: number,
): InfiniteData<T, unknown> {
	return {pages: data.pages.slice(0, count), pageParams: data.pageParams.slice(0, count)}
}

/**
 * Fetches the active queries under a key again, as pull to refresh does, with each infinite one
 * cut to its first page first, since an infinite query refetches every page it holds, one after
 * another. The later pages load again as the list scrolls to them.
 */
export function refetchFromFirstPage(client: QueryClient, queryKey: QueryKey): Promise<void> {
	// An updater's undefined leaves any other query as it is.
	client.setQueriesData({queryKey, type: 'active'}, (data: unknown) =>
		isInfiniteData(data) ? firstPagesOf(data, 1) : undefined,
	)
	return client.refetchQueries({queryKey, type: 'active'})
}
