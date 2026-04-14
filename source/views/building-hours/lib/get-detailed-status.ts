import type {Temporal} from 'temporal-polyfill'
import flatten from 'lodash/flatten'
import type {BuildingType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {isChapelTime, formatChapelTime} from './chapel'
import {isScheduleOpenAtMoment} from './is-schedule-open'
import {formatBuildingTimes} from './format-times'

export type BuildingStatus = {
	isActive: boolean
	label: string | null
	status: string
}

export function getDetailedBuildingStatus(
	info: BuildingType,
	m: Temporal.ZonedDateTime,
): BuildingStatus[] {
	let dayOfWeek = getDayOfWeek(m)

	let schedules = info.schedule || []
	if (!schedules.length) {
		return [{isActive: false, label: null, status: 'Hours unknown'}]
	}

	let results = schedules.map((set) => {
		let label = set.title
		if (set.closedForChapelTime && isChapelTime(m)) {
			return [
				{
					isActive: false,
					label,
					status: `Closed for chapel: ${formatChapelTime(m)}`,
				},
			]
		}

		let filteredSchedules = set.hours.filter((sched) =>
			sched.days.includes(dayOfWeek),
		)
		if (!filteredSchedules.length) {
			return [{isActive: false, label, status: 'Closed today'}]
		}

		return filteredSchedules.map((schedule) => {
			let isActive = isScheduleOpenAtMoment(schedule, m)
			let status = formatBuildingTimes(schedule, m)
			if (set.isPhysicallyOpen === false) {
				isActive = false
			}
			return {isActive, label, status}
		})
	})

	return flatten(results)
}
