import {isSameDay, isSameMinute} from 'date-fns'
import type {Moment} from 'moment'

export type EventType = {
	readonly title: string
	readonly description: string
	readonly location: string
	readonly startTime: Moment
	readonly endTime: Moment
	readonly isAllDay: boolean
	readonly isMultiDay: boolean
	readonly isSameInstant: boolean
	readonly isOngoing: boolean
	readonly links: Array<string>
	readonly categories: readonly string[]
	readonly config: {
		readonly startTime: boolean
		readonly endTime: boolean
		readonly subtitle: 'location' | 'description'
	}
}

/**
 * `isMultiDay` and `isSameInstant` both reduce to the same comparison of an
 * event's own start and end against each other -- only `isAllDay`, each
 * source's own statement, differs between EventKit, iCal, and the TEC feed.
 * Sharing this keeps the three parsers (and their tests) from re-deriving it
 * independently, which is how they drifted out of agreement with each other.
 */
export function deriveDayFlags(
	isAllDay: boolean,
	startTime: Date,
	endTime: Date,
): {isMultiDay: boolean; isSameInstant: boolean} {
	return {
		isMultiDay: !isAllDay && !isSameDay(startTime, endTime),
		isSameInstant: !isAllDay && isSameMinute(startTime, endTime),
	}
}
