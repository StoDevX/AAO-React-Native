import type {BuildingType} from '../types'
import {isChapelTime} from './chapel'
import {getDayOfWeek} from './get-day-of-week'
import {isScheduleOpenAtMoment} from './is-schedule-open'
import flatten from 'lodash/flatten'
import type {Moment} from 'moment-timezone'

export function isBuildingOpen(info: BuildingType, m: Moment): boolean {
	let dayOfWeek = getDayOfWeek(m)

	let schedules = info.schedule || []
	if (!schedules.length) {
		return false
	}

	let results = schedules.map((set) => {
		if (set.isPhysicallyOpen === false) {
			return false
		}
		if (set.closedForChapelTime && isChapelTime(m)) {
			return false
		}

		let filteredSchedules = set.hours.filter((sched) =>
			sched.days.includes(dayOfWeek),
		)
		if (!filteredSchedules.length) {
			return false
		}

		return filteredSchedules.map((schedule) =>
			isScheduleOpenAtMoment(schedule, m),
		)
	})

	return flatten(results).find((status) => status !== false) || false
}
