import type {CalendarInterval, NormalizedInterval} from '../types.ts'

/** Reusable expected boundaries for calendar normalization tests. */
export const CALENDAR_CASES: Array<{
	name: string
	timezone: string
	interval: CalendarInterval
	expected: NormalizedInterval
}> = [
	{
		name: 'one ordinary day in Central time',
		timezone: 'America/Chicago',
		interval: {date: '2026-10-10'},
		expected: {
			startMs: Date.parse('2026-10-10T05:00:00Z'),
			endMs: Date.parse('2026-10-11T05:00:00Z'),
			calendarDays: 1,
		},
	},
	{
		name: 'a 23-hour spring DST day',
		timezone: 'America/Chicago',
		interval: {date: '2026-03-08'},
		expected: {
			startMs: Date.parse('2026-03-08T06:00:00Z'),
			endMs: Date.parse('2026-03-09T05:00:00Z'),
			calendarDays: 1,
		},
	},
	{
		name: 'a 25-hour fall DST day',
		timezone: 'America/Chicago',
		interval: {date: '2026-11-01'},
		expected: {
			startMs: Date.parse('2026-11-01T05:00:00Z'),
			endMs: Date.parse('2026-11-02T06:00:00Z'),
			calendarDays: 1,
		},
	},
	{
		name: 'three calendar days across spring DST',
		timezone: 'America/Chicago',
		interval: {start: '2026-03-07', end: '2026-03-09'},
		expected: {
			startMs: Date.parse('2026-03-07T06:00:00Z'),
			endMs: Date.parse('2026-03-10T05:00:00Z'),
			calendarDays: 3,
		},
	},
	{
		name: 'three calendar days across fall DST',
		timezone: 'America/Chicago',
		interval: {start: '2026-10-31', end: '2026-11-02'},
		expected: {
			startMs: Date.parse('2026-10-31T05:00:00Z'),
			endMs: Date.parse('2026-11-03T06:00:00Z'),
			calendarDays: 3,
		},
	},
	{
		name: 'a leap day in UTC',
		timezone: 'UTC',
		interval: {date: '2028-02-29'},
		expected: {
			startMs: Date.parse('2028-02-29T00:00:00Z'),
			endMs: Date.parse('2028-03-01T00:00:00Z'),
			calendarDays: 1,
		},
	},
	{
		name: 'a range across New Year east of UTC',
		timezone: 'Asia/Singapore',
		interval: {start: '2026-12-31', end: '2027-01-01'},
		expected: {
			startMs: Date.parse('2026-12-30T16:00:00Z'),
			endMs: Date.parse('2027-01-01T16:00:00Z'),
			calendarDays: 2,
		},
	},
]
