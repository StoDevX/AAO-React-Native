import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../../building-hours/types'
import {isBuildingOpen} from '../../building-hours/lib/is-building-open'

export function selectOpenSpaces(
	buildings: BuildingType[],
	now: Moment,
	limit = 4,
): BuildingType[] {
	return buildings.filter((b) => isBuildingOpen(b, now)).slice(0, limit)
}
