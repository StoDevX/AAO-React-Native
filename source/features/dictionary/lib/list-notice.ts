/** What the dictionary list draws in place of, or as, its entries. */
export type ListNotice =
	| {kind: 'error'}
	| {kind: 'loading'}
	| {kind: 'empty'; title: string}
	| {kind: 'list'}

type ListState = {
	isError: boolean
	isLoading: boolean
	groupCount: number
	query: string
}

/**
 * Which of the four things the dictionary screen shows.
 *
 * The order is the whole of it: a failed fetch is the news whatever else is
 * true, a first load spins rather than claiming the dictionary is empty, and
 * only a list with nothing in it and nothing on the way says so.
 */
export function listNotice({isError, isLoading, groupCount, query}: ListState): ListNotice {
	if (isError) {
		return {kind: 'error'}
	}

	if (groupCount > 0) {
		return {kind: 'list'}
	}

	if (isLoading) {
		return {kind: 'loading'}
	}

	return {kind: 'empty', title: query ? `No results for “${query}”` : 'No results'}
}
