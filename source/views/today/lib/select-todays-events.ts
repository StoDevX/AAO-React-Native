import type {EventType} from '@frogpond/event-type'
import type {Moment} from 'moment-timezone'

export function selectTodaysEvents(
	events: EventType[],
	now: Moment,
	limit = 3,
): EventType[] {
	return events
		.filter((event) => event.endTime.isSameOrAfter(now))
		.filter((event) => event.startTime.isSame(now, 'day') || event.isOngoing)
		.sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf())
		.slice(0, limit)
}
