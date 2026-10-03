/** How far a station's schedule has got: still loading, failed, or in hand. */
export type ScheduleStatus = 'loading' | 'error' | 'ready'

/**
 * How far a query for a station's schedule has got. A paused query, which is
 * what React Query does offline, never settles into an error, so with nothing
 * cached it reads as one rather than as loading for as long as the phone is
 * offline. Data already cached is ready, whatever a refetch is doing.
 */
export function scheduleStatus({
	hasData,
	isError,
	fetchStatus,
}: {
	hasData: boolean
	isError: boolean
	fetchStatus: 'fetching' | 'paused' | 'idle'
}): ScheduleStatus {
	if (hasData) {
		return 'ready'
	}
	return isError || fetchStatus === 'paused' ? 'error' : 'loading'
}

/** What the schedule list says in place of shows, or null when it has shows to list. */
export function scheduleNote(status: ScheduleStatus, upcomingCount: number): string | null {
	switch (status) {
		case 'loading':
			return 'Loading today’s schedule…'
		case 'error':
			return 'Couldn’t load the schedule'
		default:
			return upcomingCount === 0 ? 'Nothing else today' : null
	}
}
