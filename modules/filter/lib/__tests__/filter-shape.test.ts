import {describe, expect, test} from '@jest/globals'
import {filterShape} from '../filter-shape'
import type {ListItemSpecType, ListType, PickerType, ToggleType} from '../../types'

type Item = {x: string}

function toggleFilter(): ToggleType<Item> {
	return {
		type: 'toggle',
		key: 'k',
		enabled: false,
		spec: {label: 'Specials only', title: 'Specials Only'},
		apply: {key: 'x'},
	}
}

function pickerFilter(optionCount: number): PickerType<Item> {
	return {
		type: 'picker',
		key: 'k',
		enabled: true,
		spec: {
			title: 'Level',
			options: Array.from({length: optionCount}, (_, i) => ({label: `Option ${i}`})),
		},
		apply: {key: 'x'},
	}
}

function listFilter(optionCount: number, showIcons?: boolean): ListType<Item> {
	let options: ListItemSpecType[] = Array.from({length: optionCount}, (_, i) => ({
		title: `Option ${i}`,
	}))

	return {
		type: 'list',
		key: 'k',
		enabled: false,
		spec: {title: 'Filter', options, selected: [], mode: 'OR', displayTitle: true, showIcons},
		apply: {key: 'x'},
	}
}

describe('filterShape, toggle', () => {
	test('a toggle is always a menu', () => {
		expect(filterShape(toggleFilter())).toBe('menu')
	})
})

describe('filterShape, picker', () => {
	test('renders nothing with fewer than two options', () => {
		expect(filterShape(pickerFilter(0))).toBe('none')
		expect(filterShape(pickerFilter(1))).toBe('none')
	})

	test('is a menu with two or more options', () => {
		// Course Search's Level filter -- 3 options.
		expect(filterShape(pickerFilter(3))).toBe('menu')
	})
})

describe('filterShape, list', () => {
	test('renders nothing with no options', () => {
		expect(filterShape(listFilter(0))).toBe('none')
	})

	test('Stations, 9 options, no icons -- a menu', () => {
		expect(filterShape(listFilter(9))).toBe('menu')
	})

	// The rule that is not about length at all: Dietary Restrictions has only
	// 8 options -- fewer than Stations' 9, which is a menu -- but it is a sheet
	// because only the sheet draws its icons. Invisible from the option count
	// alone, so this is the one place the rule is written down.
	test('Dietary Restrictions, 8 options, showIcons -- a sheet', () => {
		expect(filterShape(listFilter(8, true))).toBe('sheet')
	})

	test('GEs, 47 options -- a sheet', () => {
		expect(filterShape(listFilter(47))).toBe('sheet')
	})

	test('Departments, 79 options -- a sheet', () => {
		expect(filterShape(listFilter(79))).toBe('sheet')
	})

	test('14 options, just below the threshold -- a menu', () => {
		expect(filterShape(listFilter(14))).toBe('menu')
	})

	test('15 options, the threshold -- a sheet', () => {
		expect(filterShape(listFilter(15))).toBe('sheet')
	})
})
