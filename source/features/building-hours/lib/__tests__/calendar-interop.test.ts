import moment from 'moment-timezone'
import {normalizeCalendarInterval} from '@frogpond/schedules'

describe('calendar boundaries with existing Moment hours consumers', () => {
	it.each(['2026-03-08', '2026-11-01', '2026-10-10'])(
		'preserves local midnight and calendar arithmetic on %s',
		(date) => {
			let timezone = 'America/Chicago'
			let {startMs, endMs} = normalizeCalendarInterval({date}, timezone)
			let opening = moment.tz(date, 'YYYY-MM-DD', true, timezone)
			expect(startMs).toBe(opening.valueOf())
			expect(endMs).toBe(opening.clone().add(1, 'day').valueOf())
			expect(moment.tz(startMs, timezone).format('YYYY-MM-DD HH:mm')).toBe(`${date} 00:00`)
			expect(moment.tz(startMs, timezone).toDate().getTime()).toBe(startMs)
		},
	)
})
