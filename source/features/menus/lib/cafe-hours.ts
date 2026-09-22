import type {Moment} from 'moment-timezone'
import type {BuildingStatusType, BuildingType} from '../../building-hours/types'
import {
	formatBuildingTimes,
	getScheduleStatusAtMoment,
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

/**
 * The Pause's entry in `spaces/hours`, which is not what the menu screen calls
 * itself: the tab reads `The Pause`, the venue publishing the hours is `The
 * Pause Kitchen`.
 *
 * A constant rather than a literal at the call site so that
 * `cafe-hours.test.ts` can hold it against the bundled buildings -- the name is
 * a key into a file the college maintains by hand, and a rename would quietly
 * cost the header its hours.
 */
export const PAUSE_VENUE = 'The Pause Kitchen'

/** Neither open nor shut: what a screen shows before it has been told. */
const UNKNOWN: CafeHours = {time: null, closed: false}

/** The statuses that mean the doors are shut right now. */
const SHUT = new Set<BuildingStatusType>(['Closed', 'Chapel'])

/**
 * The hours to put under a cafe's name, read off the venue's own building
 * hours rather than off its menu.
 *
 * For a cafe whose menu carries no windows of its own -- the Pause, whose menu
 * is a file we keep rather than a day's service, and which BonApp publishes no
 * dayparts for.
 *
 * A venue that has not arrived yet is not a venue that is shut. The buildings
 * query resolves after the screen first draws, and before it does the honest
 * answer is to say nothing -- which is what this screen showed all along.
 */
export function cafeHours(building: BuildingType | undefined, m: Moment): CafeHours {
	if (!building) {
		return UNKNOWN
	}

	let status = getShortBuildingStatus(building, m)

	// `Chapel` counts as shut -- the doors are closed either way, and a
	// navigation bar has no room to say why -- and only the status knows about
	// chapel at all. Everything else is a venue with something to say: `Almost
	// Closed` is still serving, and `Almost Open` is about to, which is exactly
	// when the window under the name is worth reading.
	if (SHUT.has(status)) {
		return {time: null, closed: true}
	}

	// The window the status above was reading, found the way it found it:
	// `schedulesInEffect` for the day's candidates, then the first that is not
	// `Closed`. A venue serving twice publishes both windows on the same day and
	// gets both back, so taking whichever came first prints the morning's hours
	// over the evening's service -- and again, half an hour before the evening
	// opens, over the one about to start.
	//
	// A set the college has marked physically closed is skipped for the same
	// reason the status skipped it: its hours are not hours, whatever they read.
	for (let set of building.schedule ?? []) {
		if (set.isPhysicallyOpen === false) {
			continue
		}

		let schedule = schedulesInEffect(set.hours, m).find(
			(candidate) => getScheduleStatusAtMoment(candidate, m) === status,
		)

		if (schedule) {
			return {time: formatBuildingTimes(schedule, m, {compact: true}), closed: false}
		}
	}

	return {time: null, closed: true}
}
