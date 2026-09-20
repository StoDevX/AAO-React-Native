import {describe, expect, test} from '@jest/globals'

import {isClosedLabel} from '../closed'

describe('isClosedLabel', () => {
	// BonApp labels the daypart, the station and the lone item all the same
	// way for a cafe that is not serving -- Weitz, on a Sunday.
	test('recognises the word BonApp shuts a cafe with', () => {
		expect(isClosedLabel('Closed')).toBe(true)
	})

	test('does not care how it is cased', () => {
		expect(isClosedLabel('CLOSED')).toBe(true)
		expect(isClosedLabel('closed')).toBe(true)
	})

	test('leaves a meal that is actually served alone', () => {
		expect(isClosedLabel('Dinner')).toBe(false)
		expect(isClosedLabel('')).toBe(false)
	})

	// "Closed for Christmas Break" is a message about the cafe, not the label
	// of a thing on a menu; only the bare word marks a daypart as shut.
	test('is the whole label rather than a word inside one', () => {
		expect(isClosedLabel('Closed for Christmas Break')).toBe(false)
	})
})
