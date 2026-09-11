import {timezone} from '@frogpond/constants'
import moment from 'moment-timezone'
import type {CourseType} from '../../../../lib/course-search'

/** One meeting: when it runs and where. */
export interface ScheduleSlot {
	time: string
	location: string
}

/** A day's meetings, which may be more than one for a course with a lab. */
export interface ScheduleDay {
	day: string
	slots: ScheduleSlot[]
}

/**
 * A course's offerings gathered by day, with each slot's times formatted in
 * campus time.
 *
 * The feed sends one record per meeting, so a course meeting twice on a Tuesday
 * arrives as two records that belong under one heading.
 */
// Typed optional despite the feed's own type saying otherwise: the screen has
// always guarded against a course arriving without offerings, so the guard is
// answering something real.
export function courseSchedule(offerings: CourseType['offerings'] | undefined): ScheduleDay[] {
	if (!offerings) {
		return []
	}

	let byDay = new Map<string, ScheduleSlot[]>()

	for (let offering of offerings) {
		let start = moment.tz(offering.start, 'H:mm', timezone()).format('h:mm A')
		let end = moment.tz(offering.end, 'H:mm', timezone()).format('h:mm A')

		let slots = byDay.get(offering.day) ?? []
		slots.push({time: `${start} – ${end}`, location: offering.location})
		byDay.set(offering.day, slots)
	}

	return [...byDay].map(([day, slots]) => ({day, slots}))
}
