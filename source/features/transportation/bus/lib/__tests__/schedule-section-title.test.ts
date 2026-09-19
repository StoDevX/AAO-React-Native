import {describe, expect, test} from '@jest/globals'
import {scheduleSectionTitle} from '../schedule-section-title'

describe('scheduleSectionTitle', () => {
	test('says TODAY when no day is picked', () => {
		expect(scheduleSectionTitle({selectedDay: null, subtitle: 'Running'})).toBe('TODAY — RUNNING')
	})

	test('names the picked day', () => {
		expect(scheduleSectionTitle({selectedDay: 'Sa', subtitle: 'Not running today'})).toBe(
			'SATURDAY — NOT RUNNING TODAY',
		)
	})

	test('keeps the debug clock suffix', () => {
		expect(scheduleSectionTitle({selectedDay: null, subtitle: 'Running (4:32pm)'})).toBe(
			'TODAY — RUNNING (4:32PM)',
		)
	})

	test('drops the dash when there is no status to show', () => {
		expect(scheduleSectionTitle({selectedDay: 'Mo', subtitle: ''})).toBe('MONDAY')
	})
})
