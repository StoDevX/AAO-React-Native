import type {Moment} from 'moment-timezone'
import flatten from 'lodash/flatten'
import type {BuildingType} from '../types'

import {schedulesInEffect} from './schedules-in-effect'
import {isChapelTime} from './chapel'
import {isScheduleOpenAtMoment} from './is-schedule-open'

export function isBuildingOpen(info: BuildingType, m: Moment): boolean {
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

		let filteredSchedules = schedulesInEffect(set.hours, m)
		if (!filteredSchedules.length) {
			return false
		}

		return filteredSchedules.map((schedule) =>
			isScheduleOpenAtMoment(schedule, m, set.closedForChapelTime),
		)
	})

	return flatten(results).find((status) => status !== false) || false
}
