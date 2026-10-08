import {describe, expect, test} from '@jest/globals'

import {linkedPlace} from '../linked-place'

const places = [{id: 'ab'}, {id: 'toh'}]

describe('linkedPlace', () => {
	test('names the place a link gives by its id', () => {
		expect(linkedPlace('toh', places)).toBe('toh')
	})

	test.each([undefined, ''])('names none when the link gives no place (%p)', (link) => {
		expect(linkedPlace(link, places)).toBeNull()
	})

	test('names none for an id the campus has no place for', () => {
		expect(linkedPlace('nowhere', places)).toBeNull()
	})

	test('names none until the places have loaded', () => {
		expect(linkedPlace('toh', [])).toBeNull()
	})
})
