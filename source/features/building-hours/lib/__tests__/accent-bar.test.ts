import {describe, expect, test} from '@jest/globals'

import {accentBarWidth} from '../accent-bar'

describe('accentBarWidth', () => {
	test('is 4pt at the default text size', () => {
		expect(accentBarWidth(1)).toBe(4)
	})

	test('never thins below 4pt at the smaller text sizes', () => {
		expect(accentBarWidth(0.82)).toBe(4)
	})

	test('grows with the text', () => {
		expect(accentBarWidth(1.5)).toBe(6)
	})

	// Past 8pt the bar would crowd the 16pt margin it sits in.
	test('stops at 8pt at the accessibility sizes', () => {
		expect(accentBarWidth(3.12)).toBe(8)
	})
})
