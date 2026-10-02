import {expect, test} from '@jest/globals'

import {isAccessibilityTextSize} from '../is-accessibility-text-size'

test('is false at the default text size', () => {
	expect(isAccessibilityTextSize(1)).toBe(false)
})

test('is false at the largest size outside the accessibility sizes', () => {
	expect(isAccessibilityTextSize(1.353)).toBe(false)
})

test('is true from the smallest accessibility size up', () => {
	expect(isAccessibilityTextSize(1.786)).toBe(true)
	expect(isAccessibilityTextSize(3.571)).toBe(true)
})
