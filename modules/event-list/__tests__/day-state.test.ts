import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'

import {anchorShouldFollow, dayOnShow, emptyNotice, pageWindow} from '../day-state'
import type {CalendarSource, SourcedEvent} from '../types'

const CAMPUS: CalendarSource = {id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote'}
const PRESENCE: CalendarSource = {
	id: 'presence',
	title: 'Presence',
	color: 'indigo',
	kind: 'remote',
}

/** A day, in one named zone, so no assertion follows the machine it ran on. */
function day(iso: string): moment.Moment {
	return moment.tz(iso, 'America/Chicago')
}

function run(from: string, count: number): moment.Moment[] {
	return Array.from({length: count}, (_, index) => day(from).add(index, 'day'))
}

const SOME_EVENTS = [{}] as unknown as SourcedEvent[]
/** What each view would say if the only thing wrong were an empty day. */
const NOTHING_ON_FRIDAY = {text: 'Nothing on Friday.', retry: false}
const NO_EVENTS = {text: 'No events.', retry: true}

describe('emptyNotice', () => {
	let base = {sources: [CAMPUS], failed: [], events: SOME_EVENTS}

	test('a message given from outside wins over everything', () => {
		let notice = emptyNotice({...base, message: 'Offline'}, NOTHING_ON_FRIDAY)
		expect(notice).toEqual({text: 'Offline', retry: false})
	})

	test('no calendars on offers no retry, because there is nothing to reload', () => {
		let notice = emptyNotice({...base, sources: []}, NOTHING_ON_FRIDAY)
		expect(notice.text).toMatch(/^No calendars are showing/u)
		expect(notice.retry).toBe(false)
	})

	test('names the calendars that failed, and offers to try again', () => {
		let notice = emptyNotice({...base, events: [], failed: [CAMPUS, PRESENCE]}, NOTHING_ON_FRIDAY)
		expect(notice).toEqual({text: 'Could not load St. Olaf, Presence.', retry: true})
	})

	test('a failure is named ahead of an empty day, or the two read alike', () => {
		let notice = emptyNotice({...base, events: [], failed: [CAMPUS]}, NOTHING_ON_FRIDAY)
		expect(notice.text).not.toMatch(/Nothing on/u)
	})

	test('says it is loading only while it has nothing to show', () => {
		let loading = {...base, events: [], isLoading: true}
		expect(emptyNotice(loading, NOTHING_ON_FRIDAY).text).toBe('Loading…')
		expect(emptyNotice({...loading, events: SOME_EVENTS}, NOTHING_ON_FRIDAY)).toEqual(
			NOTHING_ON_FRIDAY,
		)
	})

	test('hands back what the view asked for when only the day is empty', () => {
		expect(emptyNotice(base, NOTHING_ON_FRIDAY)).toEqual(NOTHING_ON_FRIDAY)
	})

	test('the list asks for a different last line, and gets it', () => {
		expect(emptyNotice(base, NO_EVENTS)).toEqual(NO_EVENTS)
	})

	test('an earlier cause wins over the last line, whichever view asked', () => {
		let failed = {...base, events: [], failed: [CAMPUS]}
		expect(emptyNotice(failed, NO_EVENTS).text).toBe('Could not load St. Olaf.')
		expect(emptyNotice(failed, NOTHING_ON_FRIDAY).text).toBe('Could not load St. Olaf.')
	})
})

describe('pageWindow', () => {
	let days = run('2026-09-05', 30)

	test('centres on the anchor', () => {
		let pages = pageWindow(days, day('2026-09-12'), day('2026-09-12'), 3)
		expect(pages.map((one) => one.format('YYYY-MM-DD'))).toEqual([
			'2026-09-09',
			'2026-09-10',
			'2026-09-11',
			'2026-09-12',
			'2026-09-13',
			'2026-09-14',
			'2026-09-15',
		])
	})

	test('holds still while the selection moves inside it', () => {
		let anchored = pageWindow(days, day('2026-09-12'), day('2026-09-12'), 3)
		let moved = pageWindow(days, day('2026-09-12'), day('2026-09-14'), 3)
		expect(moved).toEqual(anchored)
	})

	test('follows the selection out rather than leaving it unmounted', () => {
		// The one the three handlers could each forget, and the clock could
		// break on its own: the anchor is stale and the selection is elsewhere.
		let pages = pageWindow(days, day('2026-09-12'), day('2026-09-25'), 3)
		expect(pages.some((one) => one.isSame(day('2026-09-25'), 'day'))).toBe(true)
	})

	test('always holds the selected day, wherever the anchor points', () => {
		for (let offset = 0; offset < 30; offset++) {
			let selected = day('2026-09-05').add(offset, 'day')
			let pages = pageWindow(days, day('2026-09-05'), selected, 3)
			expect(pages.some((one) => one.isSame(selected, 'day'))).toBe(true)
		}
	})

	test('clamps at the start rather than running off it', () => {
		let pages = pageWindow(days, day('2026-09-05'), day('2026-09-05'), 3)
		expect(pages[0].format('YYYY-MM-DD')).toBe('2026-09-05')
		expect(pages).toHaveLength(4)
	})

	test('hands back every day when there is nothing to centre on', () => {
		expect(pageWindow(days, null, null, 3)).toHaveLength(30)
	})
})

describe('anchorShouldFollow', () => {
	let pages = run('2026-09-05', 7)

	test('stays put for a day well inside the window', () => {
		expect(anchorShouldFollow(pages, day('2026-09-08'), 1)).toBe(false)
	})

	test('moves on for a day at the edge', () => {
		expect(anchorShouldFollow(pages, day('2026-09-05'), 1)).toBe(true)
		expect(anchorShouldFollow(pages, day('2026-09-11'), 1)).toBe(true)
	})

	test('moves on for a day the window does not hold at all', () => {
		expect(anchorShouldFollow(pages, day('2026-10-01'), 1)).toBe(true)
	})
})

describe('dayOnShow', () => {
	let days = run('2026-09-05', 7)

	test('keeps the chosen day while the range still offers it', () => {
		expect(dayOnShow(days, day('2026-09-08'), day('2026-09-05'))?.format('YYYY-MM-DD')).toBe(
			'2026-09-08',
		)
	})

	test('falls back to today when the chosen day drops out of range', () => {
		expect(dayOnShow(days, day('2026-10-20'), day('2026-09-05'))?.format('YYYY-MM-DD')).toBe(
			'2026-09-05',
		)
	})

	test('falls back to the first day when today is not in range either', () => {
		expect(dayOnShow(days, null, day('2026-08-01'))?.format('YYYY-MM-DD')).toBe('2026-09-05')
	})

	test('has nothing to show for an empty range', () => {
		expect(dayOnShow([], day('2026-09-08'), day('2026-09-05'))).toBeNull()
	})
})
