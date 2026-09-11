import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {findOpenWindow} from './find-open-window'

export function isScheduleReallyOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Moment,
): boolean {
	return findOpenWindow(schedule, m) !== null
}
