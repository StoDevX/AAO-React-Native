import {useQuery} from '@tanstack/react-query'
import {scheduleCalendarOptions} from '@frogpond/ccc-calendar'
import type {EventType} from '@frogpond/event-type'
import {useMomentTimer} from '@frogpond/timer'

import {anyScheduleEntry} from '../../schedules/entries'
import {currentAndUpcomingShows} from './current-shows'
import {scheduleStatus, type ScheduleStatus} from './player-view/schedule-note'

/** How often the current show is re-checked against the clock. */
const MINUTE = 60_000

/**
 * The query for the schedule `id` names, a station's `schedule`: its entry's
 * calendar, each event read through the entry's own mapper. Never fetched for
 * an id no campus lists.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function stationScheduleOptions(id: string) {
	let entry = anyScheduleEntry(id)
	return {
		...scheduleCalendarOptions(entry?.calendar ?? '', {eventMapper: entry?.eventMapper}),
		enabled: entry !== undefined,
	}
}

/** The show on air now on the station whose schedule is `id`, and its shows still to come today. */
export function useStationSchedule(id: string): {
	current: EventType | null
	upcoming: EventType[]
	status: ScheduleStatus
} {
	let query = useQuery(stationScheduleOptions(id))
	let {now} = useMomentTimer({intervalMs: MINUTE})
	let events = (query.data ?? []).map((sourced) => sourced.event)
	let shows = currentAndUpcomingShows(events, now)
	// Cached data from an earlier fetch still shows when a refetch fails.
	let status = scheduleStatus({
		hasData: query.data !== undefined,
		isError: query.isError,
		fetchStatus: query.fetchStatus,
	})
	return {...shows, status}
}
