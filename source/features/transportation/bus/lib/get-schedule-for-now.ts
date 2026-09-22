import type {BusSchedule, DayOfWeek} from '../types'
import type {Moment} from 'moment-timezone'
import {findClosure} from './find-closure'

const allDaysOfWeek: DayOfWeek[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/** The schedule `getScheduleForNow` falls back to: nothing running today. */
function emptySchedule(day: DayOfWeek): BusSchedule {
	return {
		days: [day],
		timetable: [],
		coordinates: {},
		stops: [],
		times: [],
	}
}

export function getScheduleForNow(schedules: BusSchedule[], now: Moment): BusSchedule {
	// now.day returns 0-6, Sunday to Saturday
	//
	// `now` is read in the app's own timezone, not the line's -- unlike
	// processBusSchedule, which parses each departure in `line.timezone`.
	// Harmless today because every line is America/Chicago, same as the app,
	// but a line in another zone could have its weekday picked a day off
	// from the one its departures are parsed in, or a closure checked
	// against the wrong day's date. Revisit alongside processBusLine's `now`
	// if that ever stops being true.
	let thisWeekday = allDaysOfWeek[now.day()]

	if (findClosure(schedules, now)) {
		return emptySchedule(thisWeekday)
	}

	let schedule = schedules.find((instance) => instance.days.includes(thisWeekday))

	return schedule ?? emptySchedule(thisWeekday)
}
