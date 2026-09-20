import {describe, expect, test} from '@jest/globals'
import type {FilterType} from '@frogpond/filter'

import {mealHeaderMenu} from '../meal-header'
import type {MenuItemType} from '../../types'

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

		expect(mealHeaderMenu(filters, 'Dinner')).toEqual({
			title: "Today's Menus",
			options: ['Breakfast', 'Lunch', 'Dinner'],
			selected: 'Dinner',
		})
	})

	// The label the button carries is the meal the menu is actually showing,
	// which `chooseMeal` decides from the clock as well as from the picker --
	// so it is passed in rather than read back out of the filter's own spec.
	test('carries the meal on screen rather than the filter spec', () => {
		let filters = [mealPicker(['Breakfast', 'Lunch'])]

		expect(mealHeaderMenu(filters, 'Lunch')?.selected).toBe('Lunch')
	})

	// A pull-down over one option is a control that cannot do anything.
	test('offers nothing when the cafe serves one meal', () => {
		expect(mealHeaderMenu([mealPicker(['Menu'])], 'Menu')).toBeNull()
	})

	// The Pause while offline: no menu has loaded, so there are no meals.
	test('offers nothing when the cafe serves no meals', () => {
		expect(mealHeaderMenu([mealPicker([])], '')).toBeNull()
	})

	test('offers nothing when the filters carry no meal picker at all', () => {
		expect(mealHeaderMenu([specialsToggle], 'Lunch')).toBeNull()
	})
})
