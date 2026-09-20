import type {Moment} from 'moment-timezone'
import type {BusClosure} from '../types'

/** Anything that might carry closures -- an unprocessed or a processed schedule. */
type HasClosures = {closures?: Array<BusClosure>}

/**
 * The closure whose date matches `now`, or `null` if none does.
 *
 * `now` is compared the same way `getScheduleForNow` picks today's weekday --
 * see the comment there. A closure's `date` is a plain `YYYY-MM-DD` string,
 * so the match is on that formatted string, which is what keeps the closure
 * date itself closed without also closing the day before or after.
 */
export function findClosure(schedules: Array<HasClosures>, now: Moment): BusClosure | null {
	let today = now.format('YYYY-MM-DD')
	let closures = schedules.flatMap((schedule) => schedule.closures ?? [])

	return closures.find((closure) => closure.date === today) ?? null
}
