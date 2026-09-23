import type {Moment} from 'moment-timezone'
import type {BuildingStatusType, BuildingType} from '../../building-hours/types'
import type {HourPairType} from '../../building-hours/lib'
import {
	findOpenWindow,
	formatBuildingTimes,
	formatCompactBuildingTime,
	formatStatusTime,
	getDayOfWeek,
	getScheduleStatusAtMoment,
	getShortBuildingStatus,
	nextOpening,
	schedulesInEffect,
	windowOpeningOn,
} from '../../building-hours/lib'

/** What a venue's published hours say about the cafe on screen right now. */
export type CafeHours = {
	/**
	 * What to say about an open cafe's hours: when it closes, e.g. `Closes at
	 * midnight`, for a venue with one window today, or the window it is serving,
	 * e.g. `4PM – Midnight`, for one with several. `null` when shut.
	 */
	time: string | null
	/** Whether the doors are closed. */
	closed: boolean
	/**
	 * What to say about a shut cafe opening again, e.g. `Opens at 4 PM`, `Closed
	 * until tomorrow`, or `Closed until 5PM`, or `null` when it is open or when
	 * there is nothing to promise.
	 */
	reopening: string | null
}

/**
 * The Pause's entry in `spaces/hours`, and the title of its menu screen. The
 * tab keeps its shorter label, `The Pause`.
 *
 * A constant rather than a literal at the call site so that
 * `cafe-hours.test.ts` can hold it against the bundled buildings -- the name is
 * a key into a file the college maintains by hand, and a rename would quietly
 * cost the header its hours.
 */
export const PAUSE_VENUE = 'The Pause Kitchen'

/** Neither open nor shut: what a screen shows before it has been told. */
const UNKNOWN: CafeHours = {time: null, closed: false, reopening: null}

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

	// A venue with one window today has one thing worth saying at a time: when
	// it opens, then when it closes. Chapel is left to the path below, which
	// knows when chapel lets out.
	if (status !== 'Chapel') {
		let windows = windowsOfTheDay(building, m)
		if (windows.length === 1) {
			return oneWindowHours(windows[0], m, opensTomorrow(building, m))
		}
	}

	// `Chapel` counts as shut -- the doors are closed either way, and a
	// navigation bar has no room to say why -- and only the status knows about
	// chapel at all. Everything else is a venue with something to say: `Almost
	// Closed` is still serving, and `Almost Open` is about to, which is exactly
	// when the window under the name is worth reading.
	if (SHUT.has(status)) {
		return shut(building, m)
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
			return {
				time: formatBuildingTimes(schedule, m, {compact: true}),
				closed: false,
				reopening: null,
			}
		}
	}

	return shut(building, m)
}

/** A venue whose doors are shut at `m`, and when they next open today. */
function shut(building: BuildingType, m: Moment): CafeHours {
	let opening = nextOpening(building, m)
	return {
		time: null,
		closed: true,
		reopening: opening ? `Closed until ${formatCompactBuildingTime(opening)}` : null,
	}
}

/**
 * The windows a venue's day holds at `m`: the one running, even when it opened
 * last night, and those that open today. Sets whose doors are not open hold
 * none.
 */
function windowsOfTheDay(building: BuildingType, m: Moment): HourPairType[] {
	let today = getDayOfWeek(m)
	let windows: HourPairType[] = []

	for (let set of building.schedule ?? []) {
		if (set.isPhysicallyOpen === false) {
			continue
		}

		for (let hours of set.hours) {
			let window =
				findOpenWindow(hours, m) ?? (hours.days.includes(today) ? windowOpeningOn(hours, m) : null)
			if (window) {
				windows.push(window)
			}
		}
	}

	return windows
}

/**
 * The line for a cafe whose day holds the one `window`: when it opens, then
 * when it closes, then that it is shut until tomorrow.
 *
 * `opensTomorrow` is `false` for a cafe known to have nothing tomorrow, which
 * is only `Closed`, and `undefined` for one whose tomorrow nobody has
 * published -- a cafe that served today is taken to serve again.
 */
export function oneWindowHours(
	window: HourPairType,
	m: Moment,
	opensTomorrow: boolean | undefined,
): CafeHours {
	if (m.isBefore(window.open)) {
		return {time: null, closed: true, reopening: `Opens at ${formatStatusTime(window.open)}`}
	}

	if (m.isBefore(window.close)) {
		return {time: `Closes at ${formatStatusTime(window.close)}`, closed: false, reopening: null}
	}

	return {
		time: null,
		closed: true,
		reopening: opensTomorrow === false ? 'Closed' : 'Closed until tomorrow',
	}
}

/** Whether any of a venue's open sets has a window starting the day after `m`. */
function opensTomorrow(building: BuildingType, m: Moment): boolean {
	let tomorrow = getDayOfWeek(m.clone().add(1, 'day'))
	return (building.schedule ?? []).some(
		(set) =>
			set.isPhysicallyOpen !== false && set.hours.some((hours) => hours.days.includes(tomorrow)),
	)
}
