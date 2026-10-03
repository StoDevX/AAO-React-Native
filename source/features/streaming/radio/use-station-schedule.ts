import {useQuery} from '@tanstack/react-query'
import {scheduleCalendarOptions} from '@frogpond/ccc-calendar'
import type {EventType} from '@frogpond/event-type'
import {useMomentTimer} from '@frogpond/timer'

import {eventMapper} from './constants'
import {currentAndUpcomingShows} from './current-shows'
import type {ScheduleStatus} from './player-view/schedule-note'
import type {StationId} from './stations'

/** How often the current show is re-checked against the clock. */
const MINUTE = 60_000

/** The station's show on air now and its shows still to come today. */
export function useStationSchedule(stationId: StationId): {
	current: EventType | null
	upcoming: EventType[]
	status: ScheduleStatus
} {
	let query = useQuery(scheduleCalendarOptions(`${stationId}-schedule`, {eventMapper}))
	let {now} = useMomentTimer({intervalMs: MINUTE})
	let events = (query.data ?? []).map((sourced) => sourced.event)
	let shows = currentAndUpcomingShows(events, now)
	// Cached data from an earlier fetch still shows when a refetch fails.
	let status: ScheduleStatus = query.data ? 'ready' : query.isError ? 'error' : 'loading'
	return {...shows, status}
}
