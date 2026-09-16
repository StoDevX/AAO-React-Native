import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {formatTime} from '@frogpond/time-format'

import {parseHours} from './parse-hours'

/**
 * `time` carries its own (campus) zone, but the reader may be in a different
 * one -- decide Midnight/Noon on the instant as the device would show it, not
 * on the campus clock reading, or a campus-midnight close can print "Midnight"
 * for a window that's actually 2pm local.
 *
 * This can't be proven in Jest: a worker's zone is pinned once at start
 * (scripts/jest-global-setup.js) and never reacts to a later `process.env.TZ`
 * change, confirmed empirically, so "device zone" and "campus zone" are always
 * the same Chicago there. See the device check in
 * `.superpowers/sdd/2026-09-16-device-zone-times/final-fix-report.md` instead.
 */
function formatSingleTime(time: Moment, locale?: string): string {
	let local = moment(time.valueOf())
	if (local.hour() === 0 && local.minute() === 0) {
		return 'Midnight'
	}
	if (local.hour() === 12 && local.minute() === 0) {
		return 'Noon'
	}
	return formatTime(time, locale)
}

export function formatBuildingTimes(
	schedule: SingleBuildingScheduleType,
	m: Moment,
	locale?: string,
): string {
	let {open, close} = parseHours(schedule, m)
	return `${formatSingleTime(open, locale)} — ${formatSingleTime(close, locale)}`
}
