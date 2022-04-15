import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {isScheduleReallyOpenAtMoment} from './is-schedule-really-open'
import {formatBuildingTimes} from './format-times'
import {parseHours} from './parse-hours'

import {data as chapelData} from '../../../../docs/chapel.json'

const chapelSchedule =
	chapelData.chapelSchedule as unknown as SingleBuildingScheduleType[]

export function isChapelTime(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): boolean {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((sched) => sched.days.includes(dayOfWeek))

	if (!sched) {
		return false
	}

	return isScheduleReallyOpenAtMoment(sched, m)
}

export function formatChapelTime(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((sched) => sched.days.includes(dayOfWeek))

	if (!sched) {
		return 'No chapel'
	}

	return formatBuildingTimes(sched, m)
}

export function getTimeUntilChapelCloses(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((sched) => sched.days.includes(dayOfWeek))

	if (!sched) {
		return 'No chapel'
	}

	let {close} = parseHours(sched, m)

	return m.clone().seconds(0).to(close)
}
