/** Which of a query-backed screen's states to draw. */
export type ListState = 'error' | 'offline' | 'loading' | 'list'

/**
 * Which state a query-backed list is in.
 *
 * Saved data wins: a failed refetch still has the last good data to show, so
 * the error is only for a load with nothing saved. Offline with nothing saved,
 * the screen waits for a connection, which is neither an empty list nor a
 * spinner's worth of waiting.
 */
export function listState(query: {
	hasData: boolean
	isError: boolean
	isPending: boolean
	isPaused: boolean
	isOnline: boolean
}): ListState {
	if (query.hasData) return 'list'
	if (query.isError) return 'error'
	// React Query pauses for an inactive app as well as for a lost connection,
	// so a pause means offline only when the device is.
	if (query.isPaused && !query.isOnline) return 'offline'
	if (query.isPending) return 'loading'
	return 'list'
}
