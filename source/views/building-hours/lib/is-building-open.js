// @flow
import moment from 'moment-timezone'
import flatten from 'lodash/flatten'
import type {BuildingType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {isChapelTime} from './chapel'
import {isScheduleOpenAtMoment} from './is-schedule-open'

export function isBuildingOpen(info: BuildingType, m: moment): boolean {
	let dayOfWeek = getDayOfWeek(m)

	let schedules = info.schedule || []
	if (!schedules.length) {
		return false
	}

	let results = schedules.map(sched => {
		if (sched.closed) {
			return false
		}
		if (sched.isPhysicallyOpen === false) {
			return false
		}
		if (sched.closedForChapelTime && isChapelTime(m)) {
			return false
		}

		let filteredSchedules = sched.hours.filter(sched =>
			sched.days.includes(dayOfWeek),
		)
		if (!filteredSchedules.length) {
			return false
		}

		return filteredSchedules.map(schedule =>
			isScheduleOpenAtMoment(schedule, m),
		)
	})

	return flatten(results).find(status => status !== false) || false
}
