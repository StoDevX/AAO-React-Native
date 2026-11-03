/**
 * Which state a screen built on one query shows. Data it already has wins over
 * a failed refresh, so a screen keeps working offline from its cached copy; the
 * error shows only when the load failed with nothing cached. A load that worked
 * and found nothing is `ready`, for the screen's own empty or not-found state.
 */
export function queryScreenState(query: {
	data: unknown
	isLoading: boolean
	isError: boolean
}): 'ready' | 'loading' | 'error' {
	if (query.data !== undefined) return 'ready'
	if (query.isLoading) return 'loading'
	return query.isError ? 'error' : 'ready'
}
