import {describe, expect, test} from '@jest/globals'
import {sheetHeightFor} from '../sheet-height'

// 800 stands in for the window less its top inset -- what UIKit measures a
// fraction against.
const AVAILABLE = 800

describe('sheetHeightFor', () => {
	test('gives the whole available height to the large detent', () => {
		expect(sheetHeightFor('large', AVAILABLE)).toBe(800)
	})

	test('gives half to the system medium detent', () => {
		expect(sheetHeightFor('medium', AVAILABLE)).toBe(400)
	})

	test('scales a fractional detent by the available height', () => {
		expect(sheetHeightFor({fraction: 0.68}, AVAILABLE)).toBeCloseTo(544)
	})

	// A detent given in points is already a height, so the available height
	// does not enter into it -- the collapsed stop is 100pt on every device.
	test('takes a point detent at its word', () => {
		expect(sheetHeightFor({height: 100}, AVAILABLE)).toBe(100)
		expect(sheetHeightFor({height: 100}, 2000)).toBe(100)
	})
})
