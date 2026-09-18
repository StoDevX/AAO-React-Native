import {describe, expect, test} from '@jest/globals'

import {columnsForFontScale, inRows} from '../tile-layout'

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

	test('a realistic AX5 scale still gives two', () => {
		expect(columnsForFontScale(3.1)).toBe(2)
	})

	test.each([0, 0.5, 1.0, 1.19, 1.2, 1.59, 1.6, 2, 3.1, 5, 10])(
		'never returns fewer than two or more than four columns for scale %d',
		(scale) => {
			let columns = columnsForFontScale(scale)
			expect(columns).toBeGreaterThanOrEqual(2)
			expect(columns).toBeLessThanOrEqual(4)
		},
	)
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
