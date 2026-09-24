import type {UseQueryResult} from '@tanstack/react-query'
import type {UnitResult} from './areas'

/// Where one unit's search has got to. Data wins over status: React Query
/// keeps a query's data when a later refetch fails, and a flaky connection
/// must not throw away postings the app already has.
export function unitResultOf(query: UseQueryResult<string[]> | undefined): UnitResult {
	if (query?.data !== undefined) return {status: 'success', ids: query.data}
	// Offline, a search that has never run is paused and waits for a
	// connection forever; with nothing to show, that is a failure to say so.
	if (query?.isError || query?.fetchStatus === 'paused') return {status: 'error'}
	return {status: 'pending'}
}
