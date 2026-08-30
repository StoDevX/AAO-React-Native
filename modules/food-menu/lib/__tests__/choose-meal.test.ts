import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {chooseMeal, EMPTY_MEAL} from '../choose-meal'
import type {MenuItemType, ProcessedMealType, StationMenuType} from '../../types'
import type {FilterType} from '@frogpond/filter'

const TIMEZONE = 'America/Chicago'

function at(time: string): moment.Moment {
	return moment.tz(`2026-08-17T${time}`, TIMEZONE)
}

function station(label: string): StationMenuType {
	return {order_id: '0', id: label, label, price: '', note: '', soup: false, items: []}
}

const MEALS: ProcessedMealType[] = [
	{label: 'Breakfast', starttime: '7:00', endtime: '11:00', stations: [station('Grill')]},
	{label: 'Lunch', starttime: '11:00', endtime: '14:00', stations: [station('Deli')]},
	{label: 'Dinner', starttime: '17:00', endtime: '20:00', stations: [station('Home')]},
]

/// The picker the menu's filter bar builds, carrying whichever meal is chosen.
function mealPicker(selected: string | undefined): FilterType<MenuItemType> {
	return {
		type: 'picker',
		key: 'meals',
		enabled: true,
		spec: {
			title: "Today's Menus",
			options: MEALS.map((meal) => ({label: meal.label})),
			selected: selected ? {label: selected} : undefined,
		},
		apply: {key: 'label'},
	}
}

describe('chooseMeal', () => {
	test('picks the meal being served at the given time', () => {
		expect(chooseMeal(MEALS, [], at('12:00:00')).label).toBe('Lunch')
	})

	// findMenuIndex takes the first meal ending after `now`, so the gap between
	// lunch and dinner belongs to dinner rather than to nothing.
	test('picks the next meal when the time falls between two', () => {
		expect(chooseMeal(MEALS, [], at('15:30:00')).label).toBe('Dinner')
	})

	test('picks the last meal of the day once they have all ended', () => {
		expect(chooseMeal(MEALS, [], at('23:00:00')).label).toBe('Dinner')
	})

	test("the user's pick wins over the time of day", () => {
		expect(chooseMeal(MEALS, [mealPicker('Breakfast')], at('12:00:00')).label).toBe('Breakfast')
	})

	test('falls back to the time of day when the picker holds no choice', () => {
		expect(chooseMeal(MEALS, [mealPicker(undefined)], at('12:00:00')).label).toBe('Lunch')
	})

	// A menu can name a meal the day's data does not carry, and an empty meal
	// renders as a closed location rather than throwing.
	test('gives back the empty meal when the pick names one that is not served', () => {
		expect(chooseMeal(MEALS, [mealPicker('Brunch')], at('12:00:00'))).toBe(EMPTY_MEAL)
	})

	test('gives back the empty meal when there are no meals at all', () => {
		expect(chooseMeal([], [], at('12:00:00'))).toBe(EMPTY_MEAL)
	})
})
