import {describe, expect, jest, test} from '@jest/globals'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

import {columnsForFontScale} from '../tile'

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
