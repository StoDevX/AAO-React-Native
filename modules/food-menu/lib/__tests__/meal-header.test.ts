import {describe, expect, test} from '@jest/globals'
import type {FilterType} from '@frogpond/filter'

import {mealHeaderMenu} from '../meal-header'
import type {MenuItemType, ProcessedMealType} from '../../types'

function mealPicker(labels: string[]): FilterType<MenuItemType> {
	return {
		type: 'picker',
		key: 'meals',
		enabled: true,
		spec: {
			title: "Today's Menus",
			options: labels.map((label) => ({label})),
			selected: {label: labels[0]},
		},
		apply: {key: 'label'},
	}
}

function meal(label: string, starttime: string, endtime: string): ProcessedMealType {
	return {label, starttime, endtime, stations: []}
}

const STAV = [
	meal('Breakfast', '07:15', '09:45'),
	meal('Lunch', '10:30', '14:00'),
	meal('Dinner', '16:30', '20:00'),
]

const specialsToggle: FilterType<MenuItemType> = {
	type: 'toggle',
	key: 'specials',
	enabled: true,
	spec: {title: 'Specials Only', label: 'Only Show Specials'},
	apply: {key: 'special'},
}

describe('mealHeaderMenu', () => {
	test('offers every meal the cafe serves, in the order it serves them', () => {
		let filters = [specialsToggle, mealPicker(['Breakfast', 'Lunch', 'Dinner'])]

		expect(mealHeaderMenu(filters, 'Dinner', STAV)).toEqual({
			title: "Today's Menus",
			options: [
				{label: 'Breakfast', time: '7:15AM–9:45AM'},
				{label: 'Lunch', time: '10:30AM–2PM'},
				{label: 'Dinner', time: '4:30PM–8PM'},
			],
			selected: 'Dinner',
		})
	})

	// The label the button carries is the meal the menu is actually showing,
	// which `chooseMeal` decides from the clock as well as from the picker --
	// so it is passed in rather than read back out of the filter's own spec.
	test('carries the meal on screen rather than the filter spec', () => {
		let filters = [mealPicker(['Breakfast', 'Lunch'])]

		expect(mealHeaderMenu(filters, 'Lunch', STAV)?.selected).toBe('Lunch')
	})

	// The picker says what can be chosen; the meals say when each one is
	// served. A meal the picker names and the menu does not has no window.
	test('leaves a meal without a window when the menu carries no times for it', () => {
		let filters = [mealPicker(['Brunch', 'Dinner'])]
		let meals = [meal('Brunch', '', ''), meal('Dinner', '16:30', '20:00')]

		expect(mealHeaderMenu(filters, 'Brunch', meals)?.options).toEqual([
			{label: 'Brunch', time: null},
			{label: 'Dinner', time: '4:30PM–8PM'},
		])
	})

	// A pull-down over one option is a control that cannot do anything.
	test('offers nothing when the cafe serves one meal', () => {
		expect(mealHeaderMenu([mealPicker(['Menu'])], 'Menu', STAV)).toBeNull()
	})

	// The Pause while offline: no menu has loaded, so there are no meals.
	test('offers nothing when the cafe serves no meals', () => {
		expect(mealHeaderMenu([mealPicker([])], '', [])).toBeNull()
	})

	test('offers nothing when the filters carry no meal picker at all', () => {
		expect(mealHeaderMenu([specialsToggle], 'Lunch', STAV)).toBeNull()
	})
})
