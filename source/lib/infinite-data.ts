import type {InfiniteData} from '@tanstack/react-query'

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
