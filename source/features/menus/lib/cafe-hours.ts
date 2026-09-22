import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../../building-hours/types'
import {
	formatBuildingTimes,
	getShortBuildingStatus,
	schedulesInEffect,
} from '../../building-hours/lib'

/** What a venue's published hours say about the cafe on screen right now. */
export type CafeHours = {
	/** The window it is serving, e.g. `4PM – Midnight`, or `null` when shut. */
	time: string | null
	/** Whether the doors are closed, which the header draws as the name alone. */
	closed: boolean
}

/** Neither open nor shut: what a screen shows before it has been told. */
const UNKNOWN: CafeHours = {time: null, closed: false}

/**
 * The hours to put under a cafe's name, read off the venue's own building
 * hours rather than off its menu.
 *
 * For a cafe whose menu carries no windows of its own -- the Pause, whose menu
 * is a file we keep rather than a day's service, and which BonApp publishes no
 * dayparts for. Its hours are a day's fact even though the food under them is
 * not, so they are drawn without a weekday beside them: a day named up there
 * would promise the menu turns over at midnight, which it does not.
 *
 * A venue that has not arrived yet is not a venue that is shut. The buildings
 * query resolves after the screen first draws, and before it does the honest
 * answer is to say nothing -- which is what this screen showed all along.
 */
export function cafeHours(building: BuildingType | undefined, m: Moment): CafeHours {
	if (!building) {
		return UNKNOWN
	}

	if (getShortBuildingStatus(building, m) === 'Closed') {
		return {time: null, closed: true}
	}

	// The first set with a window running or opening today. A venue may publish
	// several -- term hours beside a summer set -- and `schedulesInEffect` is
	// what every other screen uses to pick between them.
	for (let set of building.schedule ?? []) {
		let [schedule] = schedulesInEffect(set.hours, m)
		if (schedule) {
			return {time: formatBuildingTimes(schedule, m, {compact: true}), closed: false}
		}
	}

	return {time: null, closed: true}
}
