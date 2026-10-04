import {countSheetsOnTop} from '../sheet-dismissal'

describe('countSheetsOnTop', () => {
	test('counts nothing when the top screen is not a sheet', () => {
		expect(countSheetsOnTop(['index', 'map'])).toBe(0)
	})

	test('counts the sheets over the screen the reader was on', () => {
		expect(countSheetsOnTop(['index', 'menus', 'menu-item-detail', 'customize'])).toBe(2)
	})

	test('stops at the first screen that is not a sheet', () => {
		expect(countSheetsOnTop(['index', 'customize', 'menus', 'transit/line'])).toBe(1)
	})

	test('counts nothing for an empty stack', () => {
		expect(countSheetsOnTop([])).toBe(0)
	})
})
