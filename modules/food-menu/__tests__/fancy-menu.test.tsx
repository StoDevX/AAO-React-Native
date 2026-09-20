import * as React from 'react'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen, within} from '@testing-library/react-native'

import {FancyMenu, sectionHeaderProps} from '../fancy-menu'
import type {
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from '../types'
import type {FilterType, PickerType} from '@frogpond/filter'

/**
 * The real toolbar renders `@expo/ui/swift-ui` directly, which cannot mount
 * under Jest. This stand-in exposes the one thing this suite needs from it: a
 * way to fire the callback the toolbar fires when the user picks a different
 * meal.
 *
 * It renders no meal name of its own. Which meal is showing is `chooseMeal`'s
 * answer, and reading it back off a label this file drew would assert the mock
 * rather than the menu -- so every test below asserts the food on screen.
 */
// `@frogpond/filter`'s `FilterMenu`/`FilterSheet` render `@expo/ui/swift-ui`
// directly, which cannot mount under Jest; `applyFiltersToItem` next to them
// is the real thing this suite uses.
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})

jest.mock('../filter-menu-toolbar', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let {Pressable: P} = require('react-native') as typeof import('react-native')

	return {
		FilterMenuToolbar: ({
			filters,
			onChange,
		}: {
			filters: FilterType<MenuItemType>[]
			onChange: (filter: FilterType<MenuItemType>) => void
		}) => {
			let mealFilter = filters.find((f) => f.key === 'meals') as PickerType<MenuItemType>

			return (
				<P
					onPress={() =>
						onChange({
							...mealFilter,
							spec: {...mealFilter.spec, selected: {label: 'Dinner'}},
						})
					}
					testID="choose-dinner"
				/>
			)
		},
	}
})

const TIMEZONE = 'America/Chicago'
const BREAKFAST_TIME = '2026-08-17T09:00:00'

function station(label: string, items: string[], note = ''): StationMenuType {
	return {order_id: '0', id: label, label, price: '', note, soup: false, items}
}

const MEALS: ProcessedMealType[] = [
	{label: 'Breakfast', starttime: '7:00', endtime: '11:00', stations: [station('Grill', ['1'])]},
	{label: 'Lunch', starttime: '11:00', endtime: '14:00', stations: [station('Deli', ['2'])]},
	// A note here means `sectionHeaderProps` takes its `header` arm for a real
	// render, not just in the unit tests below -- otherwise nothing in this
	// suite ever renders a `Section` with a `header`.
	{
		label: 'Dinner',
		starttime: '17:00',
		endtime: '20:00',
		stations: [station('Home', ['3'], 'closes at 8pm')],
	},
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

describe('FancyMenu', () => {
	// The specials toggle is seeded from the meal showing when the filters were
	// built, but the meal moves -- the clock rolls on, or the user picks another.
	// A meal with no specials of its own would otherwise keep the filter applied
	// and render an empty menu behind a control the reader has to find and undo.
	test('does not apply the specials filter to a meal that has none', async () => {
		let specialAtBreakfast = {...item('1', 'Pancakes', 'Grill'), special: true}
		let plainAtDinner = item('3', 'Pot Roast', 'Home')

		await render(
			<FancyMenu
				foodItems={{
					1: specialAtBreakfast,
					2: item('2', 'Turkey Sandwich', 'Deli'),
					3: plainAtDinner,
				}}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
			/>,
		)

		// Breakfast has the special, so the filter applies there.
		expect(screen.getByText('Pancakes')).toBeTruthy()

		// Dinner has none; its one item must still be reachable rather than
		// hidden behind a filter that can only empty the screen.
		await fireEvent.press(screen.getByTestId('choose-dinner'))
		expect(screen.getByText('Pot Roast')).toBeTruthy()
	})

	// The mirror of the case above. A meal with no specials must not decide the
	// toggle for the rest of the visit: moving on to a meal that does have them
	// should leave the reader the handful worth reading, rather than every
	// condiment and dressing the cafe stocks.
	test('applies the specials filter to a meal that has them', async () => {
		let dinnerMeals: ProcessedMealType[] = MEALS.map((meal) =>
			meal.label === 'Dinner'
				? {...meal, stations: [station('Home', ['3', '4'], 'closes at 8pm')]}
				: meal,
		)

		await render(
			<FancyMenu
				foodItems={{
					1: item('1', 'Pancakes', 'Grill'),
					3: item('3', 'Pot Roast', 'Home'),
					4: {...item('4', 'Prime Rib', 'Home'), special: true},
				}}
				meals={dinnerMeals}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
			/>,
		)

		// Breakfast has no specials, so the whole meal is on screen.
		expect(screen.getByText('Pancakes')).toBeTruthy()

		await fireEvent.press(screen.getByTestId('choose-dinner'))
		expect(screen.getByText('Prime Rib')).toBeTruthy()
		expect(screen.queryByText('Pot Roast')).toBeNull()
	})

	// Which meal the menu starts on is `chooseMeal`'s decision, covered directly
	// in lib/__tests__. What only shows up at this level is whether the choice
	// outlives a render of the screen above, which hands down a fresh Moment
	// each time it renders.
	//
	// Asserted on the food rather than on a meal name, so the whole path runs:
	// the clock and the picker meet in `chooseMeal`, and its answer decides
	// which stations `groupMenuData` builds.
	test('keeps the meal the user picked when the parent re-renders', async () => {
		let {rerender} = await render(renderMenu(moment.tz(BREAKFAST_TIME, TIMEZONE)))

		await fireEvent.press(screen.getByTestId('choose-dinner'))
		expect(screen.getByText('Pot Roast')).toBeTruthy()

		// The same instant, but a fresh Moment -- which is all the menu screens
		// hand down on each of their own renders.
		await rerender(renderMenu(moment.tz(BREAKFAST_TIME, TIMEZONE)))

		// Still dinner, rather than the breakfast the clock on its own would pick.
		expect(screen.getByText('Pot Roast')).toBeTruthy()
		expect(screen.queryByText('Pancakes')).toBeNull()
	})

	// The screens above draw the meal picker in their navigation bar, so the
	// menu has to hand them what to draw -- both the one it opens on and the
	// one the reader moves to.
	test('reports the meal picker to the screen above it', async () => {
		let onMealMenuChange = jest.fn()

		await render(
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
				onMealMenuChange={onMealMenuChange}
			/>,
		)

		expect(onMealMenuChange).toHaveBeenLastCalledWith(
			expect.objectContaining({
				options: ['Breakfast', 'Lunch', 'Dinner'],
				selected: 'Breakfast',
			}),
		)

		await fireEvent.press(screen.getByTestId('choose-dinner'))

		expect(onMealMenuChange).toHaveBeenLastCalledWith(expect.objectContaining({selected: 'Dinner'}))
	})

	// The callback the screen above uses to move between meals, which nothing
	// else in the tree can reach -- the filters live in here.
	test('switches meals through the picker it reported', async () => {
		let onMealMenuChange = jest.fn()

		await render(
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
				onMealMenuChange={onMealMenuChange}
			/>,
		)

		expect(screen.getByText('Pancakes')).toBeTruthy()

		let reported = onMealMenuChange.mock.lastCall?.[0] as {select: (label: string) => void}
		await act(() => {
			reported.select('Dinner')
		})

		expect(screen.getByText('Pot Roast')).toBeTruthy()
	})

	// `FoodItemRow`'s real decision: the accessibility label names every
	// cor-icon the item carries, and each one draws a badge. Halal has no
	// `image` url, which used to mean it drew nothing at all -- the badges are
	// text, so artwork the cafe never supplied no longer costs the reader a mark.
	test('badges every dietary category the item carries, artwork or not', async () => {
		let corIcons: MasterCorIconMapType = {
			vegan: {sort: '1', label: 'Vegan', description: '', image: 'https://x/vegan.png'},
			halal: {sort: '2', label: 'Halal', description: '', image: ''},
		}
		let foodItems: MenuItemContainerType = {
			1: {...item('1', 'Pot Roast', 'Home'), cor_icon: {vegan: '', halal: ''}},
		}
		let meals: ProcessedMealType[] = [
			{label: 'Dinner', starttime: '17:00', endtime: '20:00', stations: [station('Home', ['1'])]},
		]

		await render(
			<FancyMenu
				foodItems={foodItems}
				meals={meals}
				menuCorIcons={corIcons}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
			/>,
		)

		let row = await screen.findByLabelText('Pot Roast, Vegan, Halal')

		// Tokens derived from the labels, since these are not ids the cafe's own
		// legend covers.
		expect(within(row).getByText('V')).toBeTruthy()
		expect(within(row).getByText('H')).toBeTruthy()
	})

	test('shows the empty message instead of stations when the filters exclude everything', async () => {
		await render(
			<FancyMenu
				applyFilters={() => false}
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
			/>,
		)

		expect(screen.getByText('No items to show. Try changing the filters.')).toBeTruthy()
		expect(screen.queryByText('Pancakes')).toBeNull()
	})
})

describe('sectionHeaderProps', () => {
	// A note-less station -- every fixture above -- takes `Section`'s own
	// `title`, which renders in the system's section-header style.
	test('a station with no note takes the title prop', () => {
		expect(sectionHeaderProps('Grill', undefined)).toEqual({title: 'Grill'})
	})

	// A station with a note gets a custom header node instead, carrying both
	// the name and the note.
	test('a station with a note takes a custom header', () => {
		expect('header' in sectionHeaderProps('Grill', 'closes at 2')).toBe(true)
	})
})
