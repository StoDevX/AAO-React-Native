import {describe, expect, test} from '@jest/globals'

import {UITEST_DIRECTORY_RESULTS} from '../__fixtures__/entries'
import {formatResults} from '../helpers'
import type {OfficeHours} from '../types'

const officeHoursDescription = (officeHours: Partial<OfficeHours>): string | undefined => {
	let [entry] = UITEST_DIRECTORY_RESULTS.results
	if (!entry?.officeHours) {
		throw new Error('the fixture entry has no office hours')
	}

	let [result] = formatResults([{...entry, officeHours: {...entry.officeHours, ...officeHours}}])
	return result?.officeHours?.description
}

describe('the office hours description', () => {
	test('joins the hours and the link label with a space', () => {
		expect(officeHoursDescription({content: 'M-W-F 10-noon', hrefLabel: 'Book a time'})).toBe(
			'M-W-F 10-noon Book a time',
		)
	})

	test('is only the link label when there are no hours', () => {
		expect(
			officeHoursDescription({content: '', hrefLabel: 'Schedule a Research Consultation'}),
		).toBe('Schedule a Research Consultation')
	})

	test('is only the hours when there is no link label', () => {
		expect(officeHoursDescription({content: 'M-W-F 10-noon', hrefLabel: null})).toBe(
			'M-W-F 10-noon',
		)
	})
})
