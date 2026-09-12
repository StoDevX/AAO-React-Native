import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import {deriveDayFlags, type EventType} from '@frogpond/event-type'

import {groupEvents, todaySectionKey} from '../sections'
import type {SourcedEvent} from '../types'

const NOW = moment('2026-08-17T12:00:00Z')

function makeEvent(overrides: Partial<EventType> = {}): EventType {
	let startTime = overrides.startTime ?? moment('2026-08-17T15:00:00Z')
	let endTime = overrides.endTime ?? startTime.clone().add(2, 'hours')
	let {isMultiDay, isSameInstant} = deriveDayFlags(false, startTime.toDate(), endTime.toDate())

	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime,
		endTime,
		isAllDay: false,
		isMultiDay,
		isSameInstant,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

/** A two-hour event on a given calendar, keyed so assertions can name it. */
function entryOn(sourceId: string, key: string, startTime: string): SourcedEvent {
	return {sourceId, key, event: makeEvent({startTime: moment(startTime)})}
}

describe('groupEvents', () => {
	test('orders day sections by date however the calendars were merged', () => {
		// `useMergedEvents` hands over one calendar's events at a time, so a
		// second calendar's earlier days arrive after a first calendar's later
		// ones -- today included.
		let sections = groupEvents(
			[
				entryOn('stolaf', 'late', '2026-08-25T15:00:00Z'),
				entryOn('stolaf', 'later', '2026-09-01T15:00:00Z'),
				entryOn('northfield', 'today', '2026-08-17T15:00:00Z'),
				entryOn('northfield', 'soon', '2026-08-20T15:00:00Z'),
			],
			NOW,
		)

		expect(sections.map((section) => section.key)).toEqual([
			'Today',
			'2026-08-20',
			'2026-08-25',
			'2026-09-01',
		])
	})

	test('orders rows within a shared day by time however the calendars were merged', () => {
		let sections = groupEvents(
			[
				entryOn('stolaf', 'afternoon', '2026-08-20T20:00:00Z'),
				entryOn('northfield', 'morning', '2026-08-20T14:00:00Z'),
			],
			NOW,
		)

		expect(sections).toHaveLength(1)
		expect(sections[0].data.map((entry) => entry.key)).toEqual(['morning', 'afternoon'])
	})

	test('leads with Ongoing even when its calendar is merged last', () => {
		let spanning = {
			sourceId: 'northfield',
			key: 'exhibition',
			event: makeEvent({
				startTime: moment('2026-08-10T15:00:00Z'),
				endTime: moment('2026-08-24T15:00:00Z'),
				isOngoing: true,
			}),
		}

		let sections = groupEvents([entryOn('stolaf', 'today', '2026-08-17T15:00:00Z'), spanning], NOW)

		expect(sections.map((section) => section.key)).toEqual(['Ongoing', 'Today'])
	})

	test('titles today’s section from now, and flags it as today', () => {
		let sections = groupEvents(
			[
				entryOn('stolaf', 'today', '2026-08-17T15:00:00Z'),
				entryOn('stolaf', 'tomorrow', '2026-08-18T15:00:00Z'),
			],
			NOW,
		)

		expect(sections.map((section) => [section.title, section.isToday])).toEqual([
			['Monday – Aug 17', true],
			['Tuesday – Aug 18', false],
		])
	})
})

describe('todaySectionKey', () => {
	/**
	 * The case the whole function exists for. The read window keeps 30 days of
	 * finished events, and `groupEvents` orders sections by start time, so the
	 * retained past leads the list -- opening at the top, or sending the Today
	 * button there, lands the reader in last month.
	 */
	test('picks today over the retained past that leads the list', () => {
		let sections = groupEvents(
			[
				entryOn('stolaf', 'last-month', '2026-08-01T15:00:00Z'),
				entryOn('stolaf', 'yesterday', '2026-08-16T15:00:00Z'),
				entryOn('stolaf', 'today', '2026-08-17T15:00:00Z'),
				entryOn('stolaf', 'next-week', '2026-08-24T15:00:00Z'),
			],
			NOW,
		)

		expect(sections[0].key).toBe('2026-08-01')
		expect(todaySectionKey(sections, NOW)).toBe('Today')
	})

	test('picks the next day with something on it when today has nothing', () => {
		let sections = groupEvents(
			[
				entryOn('stolaf', 'last-month', '2026-08-01T15:00:00Z'),
				entryOn('stolaf', 'next-week', '2026-08-24T15:00:00Z'),
			],
			NOW,
		)

		expect(todaySectionKey(sections, NOW)).toBe('2026-08-24')
	})

	test('picks Ongoing over a later day when something is running and today is empty', () => {
		let spanning = {
			sourceId: 'stolaf',
			key: 'spanning',
			event: makeEvent({
				startTime: moment('2026-08-15T15:00:00Z'),
				endTime: moment('2026-08-19T15:00:00Z'),
				isOngoing: true,
			}),
		}
		let sections = groupEvents(
			[
				entryOn('stolaf', 'last-month', '2026-08-01T15:00:00Z'),
				spanning,
				entryOn('stolaf', 'next-week', '2026-08-24T15:00:00Z'),
			],
			NOW,
		)

		expect(sections[0].key).toBe('2026-08-01')
		expect(todaySectionKey(sections, NOW)).toBe('Ongoing')
	})

	test('falls back to the section nearest today when everything is in the past', () => {
		let sections = groupEvents(
			[
				entryOn('stolaf', 'last-month', '2026-08-01T15:00:00Z'),
				entryOn('stolaf', 'yesterday', '2026-08-16T15:00:00Z'),
			],
			NOW,
		)

		expect(todaySectionKey(sections, NOW)).toBe('2026-08-16')
	})

	test('has nothing to scroll to when there are no sections', () => {
		expect(todaySectionKey([], NOW)).toBeNull()
	})
})
