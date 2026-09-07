import {describe, expect, test} from '@jest/globals'

import {initials} from '../person'

describe('initials', () => {
	test('takes the first letter of the first and last name', () => {
		expect(initials({firstName: 'Ada', lastName: 'Lovelace', displayName: 'Ada Lovelace'})).toBe(
			'AL',
		)
	})

	test('uppercases lowercase names', () => {
		expect(initials({firstName: 'ada', lastName: 'lovelace', displayName: 'ada lovelace'})).toBe(
			'AL',
		)
	})

	test('falls back to the display name when a name part is missing', () => {
		expect(initials({firstName: '', lastName: '', displayName: 'Cher'})).toBe('CH')
		expect(initials({firstName: 'Prince', lastName: '', displayName: 'Prince'})).toBe('PR')
	})

	test('ignores whitespace in the display-name fallback', () => {
		expect(initials({firstName: '', lastName: '', displayName: 'A B'})).toBe('AB')
	})
})
