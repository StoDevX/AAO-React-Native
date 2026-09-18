import moment, {type Moment} from 'moment-timezone'
import {timezone} from '@frogpond/constants'

/** A moment worth jumping to, and what makes it interesting. */
export type TimeJump = {
	label: string
	/** What the screen shows once you are there, so the sheet can say. */
	shows: string
	/** Built on demand: a `Moment` captured at module load would drift. */
	moment: () => Moment
}

let at = (stamp: string) => () => moment.tz(stamp, timezone())

/**
 * The states that are hard to be present for. 2026-09-07 is a Monday and
 * 2026-09-12 a Saturday; chapel runs 10:10 to 10:30 on Mondays.
 *
 * Every entry is covered by a test that checks it still lands where it claims,
 * because the hours underneath it change without warning.
 */
export const TIME_JUMPS: TimeJump[] = [
	{label: 'Chapel in 5 min', shows: 'Post Office counts down', moment: at('2026-09-07 10:05')},
	{label: 'During chapel', shows: 'Post Office reopens at 10:30', moment: at('2026-09-07 10:15')},
	{label: 'Almost open', shows: 'Pause Kitchen opens in 15 min', moment: at('2026-09-07 16:45')},
	{label: 'Phone only', shows: 'SARN answers until 8 AM', moment: at('2026-09-08 22:00')},
	{label: 'Weekend, closed', shows: 'Mail and Packages is shut', moment: at('2026-09-12 14:00')},
]
