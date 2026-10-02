import {describe, expect, it} from '@jest/globals'
import {glyphsPerRow} from '../glyph-grid'

/** The text column on a 402pt-wide phone, less the reader's 20pt margins. */
const PHONE_COLUMN = 362

/** React Native's `fontScale` at each text size, from `RCTFontSizeMultiplier`. */
const DEFAULT = 1
const XXXL = 1.353
const AX1 = 1.786
const AX2 = 2.143
const AX3 = 2.643
const AX4 = 3.143
const AX5 = 3.571

describe('glyphsPerRow', () => {
	it.each([DEFAULT, XXXL, AX1, AX2, AX3])(
		'keeps six to a row on a phone at font scale %s',
		(scale) => {
			expect(glyphsPerRow(PHONE_COLUMN, scale)).toBe(6)
		},
	)

	it.each([AX4, AX5])('steps to four to a row on a phone at font scale %s', (scale) => {
		expect(glyphsPerRow(PHONE_COLUMN, scale)).toBe(4)
	})

	it('steps to four when six would be narrower than a tap target', () => {
		// Six cells and five gaps of 4pt in 280pt leave each cell 43.3pt wide.
		expect(glyphsPerRow(280, DEFAULT)).toBe(4)
	})

	it('steps to three when four would not hold the largest glyph', () => {
		expect(glyphsPerRow(250, AX5)).toBe(3)
	})

	it('steps to two when three would not hold the largest glyph', () => {
		expect(glyphsPerRow(150, AX5)).toBe(2)
	})

	it('never goes below two, however narrow the column', () => {
		expect(glyphsPerRow(60, AX5)).toBe(2)
	})

	// Float32 in the native table reads 2.643 as 2.6429998…, so a text size must not
	// hinge on matching React Native's number exactly.
	it('reads a font scale a hair below its text size as that size', () => {
		expect(glyphsPerRow(PHONE_COLUMN, 3.1429998874664307)).toBe(4)
	})

	it('only ever chooses a count that fills every row', () => {
		for (let width = 40; width <= 1000; width += 7) {
			for (let scale of [DEFAULT, XXXL, AX1, AX2, AX3, AX4, AX5]) {
				expect(12 % glyphsPerRow(width, scale)).toBe(0)
			}
		}
	})
})
