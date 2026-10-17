import {describe, expect, test} from '@jest/globals'

import {hasContentAbove, hasContentBelow} from '../caption-scroll'

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

describe('hasContentBelow', () => {
	test('is false at the end, or within a few points of it', () => {
		expect(hasContentBelow(400, 300, 700)).toBe(false)
		expect(hasContentBelow(395, 300, 700)).toBe(false)
	})

	test('is false when everything fits, or before the area is laid out', () => {
		expect(hasContentBelow(0, 300, 200)).toBe(false)
		expect(hasContentBelow(0, 0, 700)).toBe(false)
	})

	test('is false while pulled past the end', () => {
		expect(hasContentBelow(450, 300, 700)).toBe(false)
	})

	test('is true once scrolled a clear distance up from the end', () => {
		expect(hasContentBelow(300, 300, 700)).toBe(true)
	})
})
