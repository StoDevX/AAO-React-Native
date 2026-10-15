import {describe, expect, test} from '@jest/globals'

import {hasContentAbove} from '../caption-scroll'

describe('hasContentAbove', () => {
	test('is false at the top, or within a few points of it', () => {
		expect(hasContentAbove(0)).toBe(false)
		expect(hasContentAbove(2)).toBe(false)
	})

	test('is false while pulled past the top', () => {
		expect(hasContentAbove(-30)).toBe(false)
	})

	test('is true once scrolled a clear distance down', () => {
		expect(hasContentAbove(40)).toBe(true)
	})
})
