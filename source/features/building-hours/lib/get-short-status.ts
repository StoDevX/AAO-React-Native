import type {Moment} from 'moment-timezone'
import type {BuildingStatusType, BuildingType} from '../types'

import {isChapelTime} from './chapel'
import {findChapelReopen} from './find-chapel-reopen'
import {findChapelPause} from './find-chapel-pause'
import {schedulesInEffect} from './schedules-in-effect'
import {getScheduleStatusAtMoment} from './get-schedule-status'

export function getShortBuildingStatus(info: BuildingType, m: Moment): BuildingStatusType {
	let schedules = info.schedule || []
	if (!schedules.length) {
		return 'Closed'
	}

	let statuses = schedules.flatMap((set) => {
		if (set.isPhysicallyOpen === false) {
			return 'Closed'
		}

		if (set.closedForChapelTime && isChapelTime(m)) {
			// Chapel has the doors shut either way; it is only worth naming when
			// the building opens again the minute chapel lets out.
			return findChapelReopen(set, m) ? 'Chapel' : 'Closed'
		}

		// The branch above needs chapel already running, this one needs it still
		// ahead, so the two never both fire.
		if (findChapelPause(set, m)) {
			return 'Chapel'
		}

		let filteredSchedules = schedulesInEffect(set.hours, m)
		if (!filteredSchedules.length) {
			return 'Closed'
		}

		return filteredSchedules.map((schedule) => getScheduleStatusAtMoment(schedule, m))
	})

	return statuses.find((status) => status !== 'Closed') ?? 'Closed'
}
