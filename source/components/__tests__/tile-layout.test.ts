import {describe, expect, test} from '@jest/globals'

import {
	columnsForFontScale,
	homeColumnsForFontScale,
	inRows,
	TILE_SPACING,
	wideGridShape,
} from '../tile-layout'

describe('columnsForFontScale', () => {
	test('the default scale gives four columns', () => {
		expect(columnsForFontScale(1.0)).toBe(4)
	})

	test('stays at four just below the first breakpoint', () => {
		expect(columnsForFontScale(1.19)).toBe(4)
	})

	test('drops to three at the first breakpoint', () => {
		expect(columnsForFontScale(1.2)).toBe(3)
	})

	test('stays at three just below the second breakpoint', () => {
		expect(columnsForFontScale(1.59)).toBe(3)
	})

	test('drops to two at the second breakpoint', () => {
		expect(columnsForFontScale(1.6)).toBe(2)
	})

	test('the AX5 scale still gives two', () => {
		expect(columnsForFontScale(3.571)).toBe(2)
	})

	test.each([0, 0.5, 1.0, 1.19, 1.2, 1.59, 1.6, 2, 3.571, 5, 10])(
		'never returns fewer than two or more than four columns for scale %d',
		(scale) => {
			let columns = columnsForFontScale(scale)
			expect(columns).toBeGreaterThanOrEqual(2)
			expect(columns).toBeLessThanOrEqual(4)
		},
	)
})

describe('homeColumnsForFontScale', () => {
	test('the default scale gives two columns', () => {
		expect(homeColumnsForFontScale(1.0)).toBe(2)
	})

	test('stays at two just below the accessibility sizes', () => {
		expect(homeColumnsForFontScale(1.59)).toBe(2)
	})

	test('drops to one at the first accessibility size', () => {
		expect(homeColumnsForFontScale(1.6)).toBe(1)
	})

	test('the AX5 scale still gives one', () => {
		expect(homeColumnsForFontScale(3.571)).toBe(1)
	})
})

describe('wideGridShape', () => {
	/// An iPhone 17e's 390pt, less a 16pt margin each side.
	const ROW_WIDTH = 358

	test('three columns at the default text size', () => {
		expect(wideGridShape(ROW_WIDTH, 1.0).columns).toBe(3)
	})

	test('each card is as tall as a square in a four-column grid', () => {
		let {ratio} = wideGridShape(ROW_WIDTH, 1.0)
		let cardWidth = (ROW_WIDTH - 2 * TILE_SPACING) / 3
		let squareSide = (ROW_WIDTH - 3 * TILE_SPACING) / 4
		expect(cardWidth / ratio).toBeCloseTo(squareSide)
	})

	test('follows the shared grid down to two columns at an accessibility size', () => {
		expect(wideGridShape(ROW_WIDTH, 3.571).columns).toBe(2)
	})

	/// Two cards a row at a four-column height would leave a card too short for
	/// its own accessibility-sized icon.
	test('squares its cards once there are only two a row', () => {
		expect(wideGridShape(ROW_WIDTH, 3.571).ratio).toBe(1)
	})
})

/// Only `title` matters to `inRows` -- it slices and groups, it never reads
/// anything else -- so a fixture only needs a distinct title per item to
/// tell rows and positions apart in an assertion.
function makeTiles(count: number): {title: string}[] {
	return Array.from({length: count}, (_, i) => ({title: `Tile ${i}`}))
}

describe('inRows', () => {
	test('8 items at 4 columns gives two rows of four', () => {
		let rows = inRows(makeTiles(8), 4)
		expect(rows.map((row) => row.length)).toEqual([4, 4])
	})

	test('8 items at 3 columns gives 3/3/2', () => {
		let rows = inRows(makeTiles(8), 3)
		expect(rows.map((row) => row.length)).toEqual([3, 3, 2])
	})

	test('8 items at 2 columns gives four rows of two', () => {
		let rows = inRows(makeTiles(8), 2)
		expect(rows.map((row) => row.length)).toEqual([2, 2, 2, 2])
	})

	test('an empty list gives no rows', () => {
		expect(inRows([], 4)).toEqual([])
	})
})
