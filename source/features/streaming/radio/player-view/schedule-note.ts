/** How far a station's schedule has got: still loading, failed, or in hand. */
export type ScheduleStatus = 'loading' | 'error' | 'ready'

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
