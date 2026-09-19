import {describe, expect, test} from '@jest/globals'
import {scheduleSectionTitle} from '../schedule-section-title'

describe('scheduleSectionTitle', () => {
	test('says TODAY when no day is picked', () => {
		expect(scheduleSectionTitle({selectedDay: null, subtitle: 'Running', hasTimetable: true})).toBe(
			'TODAY — RUNNING',
		)
	})

	test('names the picked day', () => {
		expect(
			scheduleSectionTitle({selectedDay: 'Sa', subtitle: 'Not running today', hasTimetable: true}),
		).toBe('SATURDAY — NOT RUNNING TODAY')
	})

	test('keeps the debug clock suffix', () => {
		expect(
			scheduleSectionTitle({selectedDay: null, subtitle: 'Running (4:32pm)', hasTimetable: true}),
		).toBe('TODAY — RUNNING (4:32PM)')
	})

	test('drops the dash when there is no status to show', () => {
		expect(scheduleSectionTitle({selectedDay: 'Mo', subtitle: '', hasTimetable: true})).toBe(
			'MONDAY',
		)
	})

	test('names only the day when there is no timetable, leaving the empty state to say why', () => {
		expect(
			scheduleSectionTitle({selectedDay: 'Sa', subtitle: 'Not running today', hasTimetable: false}),
		).toBe('SATURDAY')
	})

	test('says only TODAY when there is no timetable and no day is picked', () => {
		expect(
			scheduleSectionTitle({selectedDay: null, subtitle: 'Not running today', hasTimetable: false}),
		).toBe('TODAY')
	})
})
