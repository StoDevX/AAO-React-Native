import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isChapelTime} from './chapel'

/**
 * Whether a set's hours count at `m`: its doors are open, and it is not shut
 * for chapel while chapel runs.
 */
export function isSetInService(set: NamedBuildingScheduleType, m: Moment): boolean {
	if (set.isPhysicallyOpen === false) {
		return false
	}
	return !(set.closedForChapelTime && isChapelTime(m))
}
