import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {formatTime} from '@frogpond/time-format'

import {parseHours} from './parse-hours'

/**
 * `Noon` or `Midnight` when the instant reads as one in `zone`, else null.
 *
 * `time` carries its own (campus) zone, but the reader may be in a different
 * one -- with no `zone`, decide Midnight/Noon on the instant as the device
 * would show it, not on the campus clock reading, or a campus-midnight close
 * can print "Midnight" for a window that's actually 2pm local. Whatever
 * `zone` the caller does name is the one the clock is read on, so the label
 * agrees with the digits printed beside it.
 *
 * The device-zone half can't be proven in Jest: a worker's zone is pinned
 * once at start (scripts/jest-global-setup.js) and never reacts to a later
 * `process.env.TZ` change, confirmed empirically, so "device zone" and
 * "campus zone" are always the same Chicago there. Verified instead on a
 * simulator relaunched with a different `TZ`, against a building whose hours
 * cross midnight.
 */
function specialLabel(time: Moment, zone?: string): 'Noon' | 'Midnight' | null {
	let local = zone ? moment.tz(time.valueOf(), zone) : moment(time.valueOf())
	if (local.hour() === 0 && local.minute() === 0) {
		return 'Midnight'
	}
	if (local.hour() === 12 && local.minute() === 0) {
		return 'Noon'
	}
	return null
}

/** One end of a printed range: `Midnight`, `Noon`, or `10:30 AM`. */
function formatSingleTime(time: Moment, locale?: string, zone?: string): string {
	return specialLabel(time, zone) ?? formatTime(time, locale, zone)
}

/**
 * A time inside a sentence: `midnight`, `noon`, or `8 PM`.
 *
 * Lowercase because the status line reads "Open until midnight", where the
 * range on the detail sheet reads "10:30 AM — Midnight" and wants the capital
 * to match the weight of "10:30 AM".
 */
export function formatStatusTime(time: Moment, locale?: string): string {
	return specialLabel(time)?.toLowerCase() ?? formatTime(time, locale)
}

/**
 * `zone` names the clock the range is read on, for a screen that is not
 * showing the reader their own time -- the report form, where the hours being
 * edited are the campus's canonical schedule. Left out, the range follows the
 * device, which is what every reader-facing screen wants.
 */
export type BuildingTimesOptions = {locale?: string; zone?: string}

export function formatBuildingTimes(
	schedule: SingleBuildingScheduleType,
	m: Moment,
	{locale, zone}: BuildingTimesOptions = {},
): string {
	let {open, close} = parseHours(schedule, m)
	return `${formatSingleTime(open, locale, zone)} — ${formatSingleTime(close, locale, zone)}`
}
