import type {BusSchedule, DayOfWeek} from '../types'
import type {Moment} from 'moment-timezone'

const allDaysOfWeek: DayOfWeek[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function getScheduleForNow(
	schedules: BusSchedule[],
	now: Moment,
): BusSchedule {
	// now.day returns 0-6, Sunday to Saturday
	let thisWeekday = allDaysOfWeek[now.day()]

	if (!thisWeekday) {
		throw new Error('Invalid weekday')
	}

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
