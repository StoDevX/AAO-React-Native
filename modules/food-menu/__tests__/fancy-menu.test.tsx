import * as React from 'react'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {FancyMenu} from '../fancy-menu'
import type {
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from '../types'
import type {FilterType, PickerType} from '@frogpond/filter'

/**
 * The real toolbar is a SwiftUI popover, which cannot mount under Jest. This
 * stand-in exposes the two things this suite is about: the meal the menu is
 * currently showing, and a way to fire the callback the popover fires when the
 * user picks a different one. The logic under test is the menu's own -- whether
 * that choice survives -- not anything this mock decides.
 */
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
// `@frogpond/filter`'s barrel reaches the SwiftUI picker, which cannot mount
// under Jest; `applyFiltersToItem` next to it is the real thing this suite uses.
jest.mock('@expo/ui/community/picker', () => ({Picker: 'Picker'}))

jest.mock('../filter-menu-toolbar', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let {Pressable: P, Text: T} = require('react-native') as typeof import('react-native')

	return {
		FilterMenuToolbar: ({
			title,
			filters,
			onPopoverDismiss,
		}: {
			title: string
			filters: FilterType<MenuItemType>[]
			onPopoverDismiss: (filter: FilterType<MenuItemType>) => void
		}) => {
			let mealFilter = filters.find((f) => f.key === 'meals') as PickerType<MenuItemType>

			return (
				<>
					<T testID="meal-title">{title}</T>
					<P
						onPress={() =>
							onPopoverDismiss({
								...mealFilter,
								spec: {...mealFilter.spec, selected: {label: 'Dinner'}},
							})
						}
						testID="choose-dinner"
					/>
				</>
			)
		},
	}
})

const TIMEZONE = 'America/Chicago'
const BREAKFAST_TIME = '2026-08-17T09:00:00'

function station(label: string, items: string[]): StationMenuType {
	return {order_id: '0', id: label, label, price: '', note: '', soup: false, items}
}

const MEALS: ProcessedMealType[] = [
	{label: 'Breakfast', starttime: '7:00', endtime: '11:00', stations: [station('Grill', ['1'])]},
	{label: 'Lunch', starttime: '11:00', endtime: '14:00', stations: [station('Deli', ['2'])]},
	{label: 'Dinner', starttime: '17:00', endtime: '20:00', stations: [station('Home', ['3'])]},
]

function item(id: string, label: string, stationName: string): MenuItemType {
	return {
		connector: '',
		cor_icon: {},
		description: '',
		id,
		label,
		monotony: {} as MenuItemType['monotony'],
		nutrition: {} as MenuItemType['nutrition'],
		nutrition_link: '',
		options: [],
		price: '',
		rating: '',
		special: false,
		station: stationName,
		sub_station: '',
		sub_station_id: '',
		sub_station_order: '',
		tier3: false,
		zero_entree: '',
	}
}

const FOOD_ITEMS: MenuItemContainerType = {
	1: item('1', 'Pancakes', 'Grill'),
	2: item('2', 'Turkey Sandwich', 'Deli'),
	3: item('3', 'Pot Roast', 'Home'),
}

const COR_ICONS: MasterCorIconMapType = {}

function renderMenu(now: moment.Moment) {
	return (
		<FancyMenu
			foodItems={FOOD_ITEMS}
			meals={MEALS}
			menuCorIcons={COR_ICONS}
			name="The Caf"
			now={now}
			onItemPress={jest.fn()}
		/>
	)
}

function shownMeal(): string {
	return screen.getByTestId('meal-title').props.children as string
}

describe('FancyMenu', () => {
	// Which meal the menu starts on is `chooseMeal`'s decision, covered directly
	// in lib/__tests__. What only shows up at this level is whether the choice
	// outlives a render of the screen above, which hands down a fresh Moment
	// each time it renders.
	test('keeps the meal the user picked when the parent re-renders', async () => {
		let {rerender} = await render(renderMenu(moment.tz(BREAKFAST_TIME, TIMEZONE)))

		await fireEvent.press(screen.getByTestId('choose-dinner'))
		expect(shownMeal()).toBe('Dinner')

		// The same instant, but a fresh Moment -- which is all the menu screens
		// hand down on each of their own renders.
		await rerender(renderMenu(moment.tz(BREAKFAST_TIME, TIMEZONE)))

		expect(shownMeal()).toBe('Dinner')
	})
})
