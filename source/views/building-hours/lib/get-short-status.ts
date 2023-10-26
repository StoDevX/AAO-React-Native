import type {BuildingType} from '../types'
import {isChapelTime} from './chapel'
import {getDayOfWeek} from './get-day-of-week'
import {getScheduleStatusAtMoment} from './get-schedule-status'
import type {Moment} from 'moment-timezone'

export function getShortBuildingStatus(info: BuildingType, m: Moment): string {
	let dayOfWeek = getDayOfWeek(m)

	let schedules = info.schedule || []
	if (!schedules.length) {
		return 'Closed'
	}

	let statuses = schedules.flatMap((set) => {
		if (set.isPhysicallyOpen === false) {
			return 'Closed'
		}

		if (set.closedForChapelTime && isChapelTime(m)) {
			return 'Chapel'
		}

		let filteredSchedules = set.hours.filter((sched) =>
			sched.days.includes(dayOfWeek),
		)
		if (!filteredSchedules.length) {
			return 'Closed'
		}

		return filteredSchedules.map((schedule) =>
			getScheduleStatusAtMoment(schedule, m),
		)
	})

	return statuses.find((status) => status !== 'Closed') ?? 'Closed'
}
