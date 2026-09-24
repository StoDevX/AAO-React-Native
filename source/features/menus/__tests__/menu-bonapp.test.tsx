import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider, onlineManager} from '@tanstack/react-query'
import moment from 'moment-timezone'

import {client} from '@frogpond/api'
import {timezone} from '@frogpond/constants'
import {FoodMenu} from '@frogpond/food-menu'
import type {MealHeaderState, MenuItemType} from '@frogpond/food-menu'
import {formatDate, formatWeekday} from '@frogpond/time-format'

import {BonAppHostedMenu} from '../menu-bonapp'
import {usePublishMenuHeader} from '../menu-header'
import {bonAppCafeOptions, bonAppMenuOptions} from '../query'
import {OFFLINE_MESSAGE} from '../lib/menu-view'
import type {EditedBonAppCafeInfoType, EditedBonAppMenuInfoType} from '../types'

// The header is the thing under test, so what the screen publishes is read
// straight off the call rather than through the SwiftUI title that draws it.
jest.mock('../menu-header', () => ({usePublishMenuHeader: jest.fn()}))

// The menu body renders `@expo/ui`, which cannot mount under Jest. What the
// screen hands it is read off the call.
jest.mock('@frogpond/food-menu', () => ({FoodMenu: jest.fn(() => null)}))

// The suite-wide setup runs as a UI test, whose clock is frozen and never
// ticks -- which is the one thing this file is about. It also swaps the
// network for fixtures, which the seeded queries below make unnecessary.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

// Every fetch fails, so a test that refetches sees what a 5xx or a captive
// portal would hand the screen.
jest.mock('@frogpond/api', () => ({
	client: {get: jest.fn(() => ({json: () => Promise.reject(new Error('HTTP 503'))}))},
}))

// One router for the whole run, as expo-router's own hook hands back.
const mockRouter = {navigate: jest.fn()}

jest.mock('expo-router', () => ({
	useIsFocused: () => true,
	useRouter: () => mockRouter,
}))

const mockPublish = usePublishMenuHeader as jest.MockedFunction<typeof usePublishMenuHeader>
const mockFoodMenu = FoodMenu as unknown as jest.Mock<
	(props: {
		now: unknown
		onItemPress: (item: MenuItemType) => void
		onMealHeaderChange: (header: MealHeaderState) => void
	}) => null
>
const mockGet = client.get as unknown as jest.Mock

/** The Cage's one daypart, as Bon Appétit publishes it. */
const CAGE_DAYPART = {
	id: '701',
	label: 'The Cage',
	starttime: '07:30',
	endtime: '20:00',
	message: '',
}

const CAGE_MENU = {
	items: {},
	cor_icons: {},
	days: [
		{
			date: '2026-09-22',
			cafe: {
				name: 'The Cage',
				menu_id: '1',
				dayparts: [[{...CAGE_DAYPART, abbreviation: 'CB', stations: []}]],
			},
		},
	],
} as unknown as EditedBonAppMenuInfoType

const CAGE_CAFE = {
	cafe: {
		name: 'The Cage',
		days: [{date: '2026-09-22', dayparts: [CAGE_DAYPART], status: '', message: false}],
	},
} as unknown as EditedBonAppCafeInfoType

let queryClient: QueryClient

beforeEach(() => {
	// Half a minute before the Cage opens, in campus time.
	jest.useFakeTimers({now: new Date('2026-09-22T12:29:30Z')})

	// Seeded fresh, so no query refetches through a network Jest does not have.
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(bonAppMenuOptions('the-cage', '2026-09-22').queryKey, CAGE_MENU)
	queryClient.setQueryData(bonAppCafeOptions('the-cage', '2026-09-22').queryKey, CAGE_CAFE)
	mockPublish.mockClear()
	mockFoodMenu.mockClear()
	mockGet.mockClear()
	mockRouter.navigate.mockClear()
})

afterEach(() => {
	onlineManager.setOnline(true)
	queryClient.clear()
	jest.useRealTimers()
})

function renderCage() {
	return render(
		<QueryClientProvider client={queryClient}>
			<BonAppHostedMenu cafe="the-cage" loadingMessage={['Loading…']} name="The Cage" />
		</QueryClientProvider>,
	)
}

/** What the screen last put in the navigation bar. */
function lastHeader() {
	return mockPublish.mock.lastCall?.[0]
}

describe('BonAppHostedMenu', () => {
	// The line under the name is relative to the clock -- `Opens at 7:30 AM` is
	// false a minute later -- and a tab stays mounted for as long as the reader
	// keeps coming back to it, so the screen has to follow the clock rather than
	// read it once.
	test('moves the line under the name on as the clock turns over', async () => {
		await render(
			<QueryClientProvider client={queryClient}>
				<BonAppHostedMenu cafe="the-cage" loadingMessage={['Loading…']} name="The Cage" />
			</QueryClientProvider>,
		)

		expect(lastHeader()).toMatchObject({closed: true, reopening: 'Opens at 7:30 AM'})

		await act(async () => {
			await jest.advanceTimersByTimeAsync(60_000)
		})

		expect(lastHeader()).toMatchObject({closed: false, time: 'Closes at 8 PM', reopening: null})
	})

	// Every cafe the reader has visited stays mounted, and only the header needs
	// the minute. The menu body is handed a clock that turns over with the day,
	// so a tick leaves its props as they were and the body is not rebuilt.
	test('keeps the menu body off the per-minute tick', async () => {
		await render(
			<QueryClientProvider client={queryClient}>
				<BonAppHostedMenu cafe="the-cage" loadingMessage={['Loading…']} name="The Cage" />
			</QueryClientProvider>,
		)

		let firstNow = mockFoodMenu.mock.calls[0]?.[0].now
		expect(firstNow).toBeDefined()

		await act(async () => {
			await jest.advanceTimersByTimeAsync(60_000)
		})

		expect(mockFoodMenu.mock.lastCall?.[0].now).toBe(firstNow)
	})

	// React Query keeps a query's data when a refetch of it fails, so the menu
	// already on screen is still there to show.
	test('keeps a cached menu on screen when its refetch fails', async () => {
		await renderCage()

		await act(async () => {
			await queryClient.refetchQueries()
			await jest.runOnlyPendingTimersAsync()
		})

		expect(
			queryClient.getQueryState(bonAppMenuOptions('the-cage', '2026-09-22').queryKey)?.status,
		).toBe('error')
		expect(screen.queryByText(/HTTP 503/u)).toBeNull()
		expect(mockFoodMenu).toHaveBeenCalled()
	})

	// The cafe's hours and closure notices come from a second query. The menu
	// can be shown without them.
	test('shows the menu when only the cafe details fail to load', async () => {
		queryClient.removeQueries({queryKey: bonAppCafeOptions('the-cage', '2026-09-22').queryKey})
		await renderCage()

		await act(async () => {
			await jest.runOnlyPendingTimersAsync()
		})

		expect(screen.queryByText(/HTTP 503/u)).toBeNull()
		expect(mockFoodMenu).toHaveBeenCalled()
	})

	test('says it is offline when nothing is cached and there is no network', async () => {
		queryClient.clear()
		onlineManager.setOnline(false)
		await renderCage()

		expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy()
		expect(screen.queryByText(/Something went wrong/u)).toBeNull()
		expect(lastHeader()).toMatchObject({loading: false, meals: null})
	})

	test('shows an error with a retry when the first load fails', async () => {
		queryClient.clear()
		await renderCage()

		await act(async () => {
			await jest.runOnlyPendingTimersAsync()
		})

		expect(screen.getByText('Error: HTTP 503')).toBeTruthy()
		expect(screen.getByText('Again!')).toBeTruthy()
		expect(mockFoodMenu).not.toHaveBeenCalled()
	})

	// A cafe with no day in its menu response has nothing to show, which is not
	// a reason to crash the screen.
	test('says there is no menu when the response has no days', async () => {
		queryClient.setQueryData(bonAppMenuOptions('the-cage', '2026-09-22').queryKey, {
			...CAGE_MENU,
			days: [],
		})
		await renderCage()

		expect(screen.getByText('The Cage has not posted a menu for today.')).toBeTruthy()
		expect(mockFoodMenu).not.toHaveBeenCalled()
	})

	// The meal picker belongs to the menu body. Once a notice replaces the body,
	// the picker it last reported has nothing under it.
	describe('drops the meal picker when a notice replaces the menu', () => {
		async function renderWithPicker() {
			await renderCage()
			await act(() => {
				mockFoodMenu.mock.lastCall?.[0].onMealHeaderChange({
					menu: {} as MealHeaderState['menu'],
					time: '7:30 AM – 8 PM',
					closed: false,
				})
			})
			expect(lastHeader()?.meals).not.toBeNull()
		}

		test('for a refetch that comes back with no days', async () => {
			await renderWithPicker()

			await act(async () => {
				queryClient.setQueryData(bonAppMenuOptions('the-cage', '2026-09-22').queryKey, {
					...CAGE_MENU,
					days: [],
				})
				await jest.runOnlyPendingTimersAsync()
			})

			expect(screen.getByText('The Cage has not posted a menu for today.')).toBeTruthy()
			expect(lastHeader()?.meals).toBeNull()
		})

		test('for cafe details that name no cafe', async () => {
			await renderWithPicker()

			await act(async () => {
				queryClient.setQueryData(bonAppCafeOptions('the-cage', '2026-09-22').queryKey, {
					cafe: [],
				} as unknown as EditedBonAppCafeInfoType)
				await jest.runOnlyPendingTimersAsync()
			})

			expect(screen.getByText(/There is no cafe with id/u)).toBeTruthy()
			expect(lastHeader()?.meals).toBeNull()
		})
	})

	// A menu fetched shortly before midnight is still fresh by the clock after
	// it, and one restored from the disk cache can be a day old.
	test("fetches today's menu rather than showing an earlier day's", async () => {
		jest.setSystemTime(new Date('2026-09-23T13:00:00Z'))
		await renderCage()

		expect(mockGet).toHaveBeenCalledWith('food/named/menu/the-cage', expect.anything())
		expect(mockFoodMenu).not.toHaveBeenCalled()
	})

	// The menu body builds its meal picker and filters once, from the meals it
	// is first handed. Stav serves Breakfast, Lunch and Dinner every day, so a
	// new day's menu looks like the old one by its meals alone.
	test("fetches a new day's menu into a fresh menu body when the day turns", async () => {
		let nextDay = {...CAGE_MENU, days: [{...CAGE_MENU.days[0], date: '2026-09-23'}]}
		let nextCafe = {
			cafe: {...CAGE_CAFE.cafe, days: [{...CAGE_CAFE.cafe.days[0], date: '2026-09-23'}]},
		}
		mockGet.mockImplementation((path) => ({
			json: () => Promise.resolve(path === 'food/named/menu/the-cage' ? nextDay : nextCafe),
		}))
		let mounts = 0
		mockFoodMenu.mockImplementation(() => {
			React.useEffect(() => {
				mounts += 1
			}, [])
			return null
		})

		await renderCage()
		expect(mounts).toBe(1)

		await act(async () => {
			jest.setSystemTime(new Date('2026-09-23T13:00:00Z'))
			await jest.advanceTimersByTimeAsync(60_000)
		})

		expect(mockGet).toHaveBeenCalledWith('food/named/menu/the-cage', expect.anything())
		// React Query hands the fetched menu over on a timer of its own.
		await waitFor(() => expect(mounts).toBe(2))

		mockFoodMenu.mockImplementation(() => null)
		mockGet.mockImplementation(() => ({json: () => Promise.reject(new Error('HTTP 503'))}))
	})

	// The detail screen reads the item out of the menu this screen fetched,
	// which is cached under the day it is for.
	test('links an item to the day of the menu it came from', async () => {
		await renderCage()

		await act(() => {
			mockFoodMenu.mock.lastCall?.[0].onItemPress({id: '42'} as MenuItemType)
		})

		expect(mockRouter.navigate).toHaveBeenCalledWith({
			pathname: '/MenuItemDetail',
			params: {source: 'bonapp', cafe: 'the-cage', day: '2026-09-22', itemId: '42'},
		})
	})

	// Asked for today's menu shortly after midnight, the server can still answer
	// with the day before's, as Weitz's did at half past twelve.
	test('labels a menu the server answers for an earlier day with that day', async () => {
		jest.setSystemTime(new Date('2026-09-23T05:30:00Z'))
		queryClient.setQueryData(bonAppMenuOptions('the-cage', '2026-09-23').queryKey, CAGE_MENU)
		// Today's hours, which say nothing about the day before's menu.
		let todaysCafe = {
			cafe: {...CAGE_CAFE.cafe, days: [{...CAGE_CAFE.cafe.days[0], date: '2026-09-23'}]},
		}
		queryClient.setQueryData(bonAppCafeOptions('the-cage', '2026-09-23').queryKey, todaysCafe)
		await renderCage()

		let menuDay = moment.tz('2026-09-22', timezone())
		expect(lastHeader()).toMatchObject({
			weekdayLong: formatWeekday(menuDay, 'long'),
			weekdayShort: formatWeekday(menuDay, 'short'),
			date: formatDate(menuDay, 'medium'),
			reopening: null,
		})
		expect(mockFoodMenu).toHaveBeenCalled()
	})
})
