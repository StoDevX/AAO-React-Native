import type {FetchStatus} from '@tanstack/react-query'

/**
 * Which state a screen built on one query shows. Data it already has wins over
 * a failed refresh, so a screen keeps working offline from its cached copy; the
 * error shows only when the load failed with nothing cached. A first load that
 * is fetching, or paused offline until a connection returns, shows the spinner.
 * A load that worked and found nothing, or a query switched off, is `ready`,
 * for the screen's own empty or not-found state.
 */
export function queryScreenState(query: {
	data: unknown
	isPending: boolean
	fetchStatus: FetchStatus
	isError: boolean
}): 'ready' | 'loading' | 'error' {
	if (query.data !== undefined) return 'ready'
	if (query.isPending && query.fetchStatus !== 'idle') return 'loading'
	return query.isError ? 'error' : 'ready'
}
