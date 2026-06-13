import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'
import {selectTodaysEvents} from '../select-todays-events'

const ev = (startISO: string, endISO: string, title: string): EventType =>
	({
		title,
		description: '',
		location: '',
		startTime: moment(startISO),
		endTime: moment(endISO),
		isOngoing: false,
		links: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
	}) as EventType

describe('selectTodaysEvents', () => {
	const now = moment('2026-06-13T09:00:00')

	it('keeps events later today, sorted by start time', () => {
		let events = [
			ev('2026-06-13T15:00:00', '2026-06-13T16:00:00', 'afternoon'),
			ev('2026-06-13T11:00:00', '2026-06-13T12:00:00', 'late morning'),
		]
		let result = selectTodaysEvents(events, now)
		expect(result.map((e) => e.title)).toEqual(['late morning', 'afternoon'])
	})

	it('drops events that already ended', () => {
		let events = [ev('2026-06-13T07:00:00', '2026-06-13T08:00:00', 'earlier')]
		expect(selectTodaysEvents(events, now)).toHaveLength(0)
	})

	it('drops events on other days', () => {
		let events = [ev('2026-06-14T10:00:00', '2026-06-14T11:00:00', 'tomorrow')]
		expect(selectTodaysEvents(events, now)).toHaveLength(0)
	})

	it('respects the limit', () => {
		let events = Array.from({length: 5}, (_, i) =>
			ev(`2026-06-13T1${i}:00:00`, `2026-06-13T1${i}:30:00`, `e${i}`),
		)
		expect(selectTodaysEvents(events, now, 3)).toHaveLength(3)
	})
})
