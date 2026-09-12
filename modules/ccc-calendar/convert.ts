import type {EventType} from '@frogpond/event-type'
import moment, {type Moment} from 'moment'

import type {WireEvent} from './parsers/events'

export type EventMapper = (event: EventType) => EventType

/**
 * An all-day event names a calendar date, not an instant. What both web
 * sources guarantee is that the wire instant's UTC date IS that calendar
 * date -- iCal satisfies this by emitting UTC midnight, TEC by emitting
 * campus midnight expressed in UTC (`05:00Z` for a `America/Chicago` day).
 * Everything downstream -- the section keys, the day-picker strip, every
 * `Intl` format -- reads a moment in the device's zone, so reading the UTC
 * date straight through would land on the day before anywhere west of UTC.
 * This reads the date back out in UTC and rebuilds it as local midnight,
 * which is where a day sits for every other part of the calendar.
 */
export function localMidnightOf(instant: string): Moment {
	return moment(moment.utc(instant).format('YYYY-MM-DD'), 'YYYY-MM-DD')
}

export function convertEvents(
	data: WireEvent[],
	options: {eventMapper?: EventMapper},
): EventType[] {
	let events: EventType[] = data.map((event) => {
		let startTime = event.isAllDay ? localMidnightOf(event.startTime) : moment(event.startTime)
		let endTime = event.isAllDay ? localMidnightOf(event.endTime) : moment(event.endTime)

		// An all-day event whose wire start and end share a UTC date collapses to
		// a zero-length span, which the calendar's own "has it ended?" filter
		// reads as already over. A day-long event covers its day.
		if (event.isAllDay && !endTime.isAfter(startTime)) {
			endTime = startTime.clone().add(1, 'day')
		}

		return {...event, startTime, endTime}
	})

	if (options.eventMapper) {
		events = events.map(options.eventMapper)
	}

	return events
}
