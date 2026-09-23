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

	// A refetch of the same day hands down new objects for the same meals, which
	// is not a new day's menu and must not cost the reader their pick.
	test('keeps the meal the user picked when the same meals are fetched again', async () => {
		let menu = (meals: ProcessedMealType[]) => (
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={meals}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
			/>
		)

		let {rerender} = await render(menu(MEALS))
		await fireEvent.press(screen.getByTestId('choose-dinner'))
		expect(screen.getByText('Pot Roast')).toBeTruthy()

		await rerender(menu(MEALS.map((meal) => ({...meal}))))

		expect(screen.getByText('Pot Roast')).toBeTruthy()
		expect(screen.queryByText('Pancakes')).toBeNull()
	})

	// A cold launch draws yesterday's menu from the disk cache, and today's
	// arrives a moment later on the same mounted menu. When the day's meals
	// differ -- Saturday's lunch, Sunday's brunch -- the meal chosen from
	// yesterday's is not one today serves, and the menu has to move to today's
	// rather than draw nothing.
	test("moves to today's meals when they replace yesterday's", async () => {
		let onMealHeaderChange = jest.fn()
		let sundayMorning = moment.tz('2026-08-16T10:23:00', TIMEZONE)
		let sundayMeals: ProcessedMealType[] = [
			{label: 'Brunch', starttime: '10:00', endtime: '13:30', stations: [station('Grill', ['5'])]},
			{label: 'Dinner', starttime: '17:00', endtime: '20:00', stations: [station('Home', ['3'])]},
		]
		let menu = (meals: ProcessedMealType[], foodItems: MenuItemContainerType) => (
			<FancyMenu
				foodItems={foodItems}
				meals={meals}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={sundayMorning}
				onItemPress={jest.fn()}
				onMealHeaderChange={onMealHeaderChange}
			/>
		)

		let {rerender} = await render(menu(MEALS, FOOD_ITEMS))
		expect(screen.getByText('Pancakes')).toBeTruthy()

		await rerender(
			menu(sundayMeals, {
				3: item('3', 'Pot Roast', 'Home'),
				5: item('5', 'Waffles', 'Grill'),
			}),
		)

		expect(screen.getByText('Waffles')).toBeTruthy()
		expect(onMealHeaderChange).toHaveBeenLastCalledWith(
			expect.objectContaining({
				menu: expect.objectContaining({
					options: [
						{label: 'Brunch', time: '10AM \u2013 1:30PM'},
						{label: 'Dinner', time: '5PM \u2013 8PM'},
					],
					selected: 'Brunch',
				}),
			}),
		)
	})

	// The screens above draw the meal picker in their navigation bar, so the
	// menu has to hand them what to draw -- both the one it opens on and the
	// one the reader moves to.
	test('reports the meal picker to the screen above it', async () => {
		let onMealHeaderChange = jest.fn()

		await render(
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
				onMealHeaderChange={onMealHeaderChange}
			/>,
		)

		expect(onMealHeaderChange).toHaveBeenLastCalledWith(
			expect.objectContaining({
				menu: expect.objectContaining({
					options: [
						{label: 'Breakfast', time: '7AM \u2013 11AM'},
						{label: 'Lunch', time: '11AM \u2013 2PM'},
						{label: 'Dinner', time: '5PM \u2013 8PM'},
					],
					selected: 'Breakfast',
				}),
			}),
		)

		await fireEvent.press(screen.getByTestId('choose-dinner'))

		expect(onMealHeaderChange).toHaveBeenLastCalledWith(
			expect.objectContaining({menu: expect.objectContaining({selected: 'Dinner'})}),
		)
	})

	// The title says when the meal on screen is served, and a cafe serving one
	// meal has no picker to carry it -- so the window is reported apart from
	// the picker rather than inside it.
	test('reports the window the meal on screen is served in', async () => {
		let onMealHeaderChange = jest.fn()

		await render(
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
				onMealHeaderChange={onMealHeaderChange}
			/>,
		)

		expect(onMealHeaderChange).toHaveBeenLastCalledWith(
			expect.objectContaining({time: '7AM \u2013 11AM'}),
		)

		await fireEvent.press(screen.getByTestId('choose-dinner'))

		expect(onMealHeaderChange).toHaveBeenLastCalledWith(
			expect.objectContaining({time: '5PM \u2013 8PM'}),
		)
	})

	// The Cage: one meal, so there is nothing to pick, but the hours it keeps
	// are still what the reader came to the header for.
	test('reports a window but no picker for a cafe serving one meal', async () => {
		let onMealHeaderChange = jest.fn()

		await render(
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={[MEALS[0]]}
				menuCorIcons={COR_ICONS}
				name="The Cage"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
				onMealHeaderChange={onMealHeaderChange}
			/>,
		)

		expect(onMealHeaderChange).toHaveBeenLastCalledWith({
			menu: null,
			time: '7AM \u2013 11AM',
			closed: false,
		})
	})

	// Weitz on a Sunday: BonApp shuts a cafe by publishing one daypart named
	// `Closed`, and there is nothing true to put under the cafe's name.
	test('reports a cafe BonApp has shut', async () => {
		let onMealHeaderChange = jest.fn()
		let closedMeal: ProcessedMealType = {
			label: 'Closed',
			starttime: '00:00',
			endtime: '24:00',
			stations: [station('Closed', ['1'])],
		}

		await render(
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={[closedMeal]}
				menuCorIcons={COR_ICONS}
				name="Weitz Center"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
				onMealHeaderChange={onMealHeaderChange}
			/>,
		)

		expect(onMealHeaderChange).toHaveBeenLastCalledWith({menu: null, time: null, closed: true})
	})

	// The callback the screen above uses to move between meals, which nothing
	// else in the tree can reach -- the filters live in here.
	test('switches meals through the picker it reported', async () => {
		let onMealHeaderChange = jest.fn()

		await render(
			<FancyMenu
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
				onMealHeaderChange={onMealHeaderChange}
			/>,
		)

		expect(screen.getByText('Pancakes')).toBeTruthy()

		let reported = onMealHeaderChange.mock.lastCall?.[0] as {
			menu: {select: (label: string) => void}
		}
		await act(() => {
			reported.menu.select('Dinner')
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

	// The screens above open a menu with its filter row hidden, behind a button
	// in the navigation bar. Which of the two a menu draws is its own decision;
	// what the row then looks like is not something Jest can see.
	test('draws the filter row only when the screen above asks for it', async () => {
		let {rerender} = await render(
			<FancyMenu
				filtersVisible={false}
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
			/>,
		)

		expect(screen.queryByTestId('choose-dinner')).toBeNull()
		// The menu itself is unaffected -- only the row is gone.
		expect(screen.getByText('Pancakes')).toBeTruthy()

		await rerender(
			<FancyMenu
				filtersVisible={true}
				foodItems={FOOD_ITEMS}
				meals={MEALS}
				menuCorIcons={COR_ICONS}
				name="The Caf"
				now={moment.tz(BREAKFAST_TIME, TIMEZONE)}
				onItemPress={jest.fn()}
			/>,
		)

		expect(screen.getByTestId('choose-dinner')).toBeTruthy()
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
