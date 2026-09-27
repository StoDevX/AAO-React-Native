import {describe, expect, test} from '@jest/globals'

import {collapsedSummary} from '../lib'

describe('collapsedSummary', () => {
	test('counts one tile in the singular', () => {
		expect(collapsedSummary(1)).toBe('1 tile')
	})

	test('counts several tiles in the plural', () => {
		expect(collapsedSummary(4)).toBe('4 tiles')
	})
})
