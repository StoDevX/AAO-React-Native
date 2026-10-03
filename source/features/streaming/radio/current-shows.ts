import type {Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

/**
 * The show on air at `now`, and the shows still to start on `now`'s own
 * calendar day, earliest first. A show crossing midnight counts as current
 * until it ends, and "today" is then the new day.
 */
export function currentAndUpcomingShows(
	events: readonly EventType[],
	now: Moment,
): {current: EventType | null; upcoming: EventType[]} {
	let byStart = [...events].sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf())
	// The latest-starting show that has begun wins, so a back-to-back
	// hand-off lands on the show starting this minute.
	let onAir = byStart.filter((e) => !e.startTime.isAfter(now) && e.endTime.isAfter(now))
	let current = onAir.at(-1) ?? null
	let upcoming = byStart.filter((e) => e.startTime.isAfter(now) && e.startTime.isSame(now, 'day'))
	return {current, upcoming}
}
