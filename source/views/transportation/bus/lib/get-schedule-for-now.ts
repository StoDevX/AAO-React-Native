import type {BusSchedule, DayOfWeek} from '../types'
import type {Temporal} from 'temporal-polyfill'
import {dayOfWeekNumber} from '../../../../lib/temporal'

const allDaysOfWeek: DayOfWeek[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function getScheduleForNow(
	schedules: BusSchedule[],
	now: Temporal.ZonedDateTime,
): BusSchedule {
	let thisWeekday = allDaysOfWeek[dayOfWeekNumber(now)]

	let schedule = schedules.find((instance) =>
		instance.days.includes(thisWeekday),
	)

	if (!schedule) {
		return {
			days: [thisWeekday],
			timetable: [],
			coordinates: {},
			stops: [],
			times: [],
		}
	}

	return schedule
}
