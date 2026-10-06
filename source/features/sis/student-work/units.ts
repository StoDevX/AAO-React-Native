import type {FetchStatus} from '@tanstack/react-query'

/// Whether the app knows which unit each posting belongs to: loading at
/// first, then ready or unavailable as a whole.
export type UnitsAvailability = 'loading' | 'ready' | 'unavailable'

/// Data wins over status: React Query keeps a query's data when a later
/// refetch fails, and a map saved from an earlier launch still sorts the
/// board.
export function unitsAvailability(query: {
	data: unknown
	isError: boolean
	fetchStatus: FetchStatus
}): UnitsAvailability {
	if (query.data !== undefined) return 'ready'
	// Offline, a query that has never run is paused and waits for a
	// connection forever; with nothing to show, that is a failure to say so.
	if (query.isError || query.fetchStatus === 'paused') return 'unavailable'
	return 'loading'
}
