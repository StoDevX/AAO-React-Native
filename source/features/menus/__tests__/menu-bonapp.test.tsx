import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider, onlineManager} from '@tanstack/react-query'

import {FoodMenu} from '@frogpond/food-menu'

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
const mockFoodMenu = FoodMenu as unknown as jest.Mock<(props: {now: unknown}) => null>

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
	queryClient.setQueryData(bonAppMenuOptions('the-cage').queryKey, CAGE_MENU)
	queryClient.setQueryData(bonAppCafeOptions('the-cage').queryKey, CAGE_CAFE)
	mockPublish.mockClear()
	mockFoodMenu.mockClear()
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

		expect(queryClient.getQueryState(bonAppMenuOptions('the-cage').queryKey)?.status).toBe('error')
		expect(screen.queryByText(/HTTP 503/u)).toBeNull()
		expect(mockFoodMenu).toHaveBeenCalled()
	})

	// The cafe's hours and closure notices come from a second query. The menu
	// can be shown without them.
	test('shows the menu when only the cafe details fail to load', async () => {
		queryClient.removeQueries({queryKey: bonAppCafeOptions('the-cage').queryKey})
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
		queryClient.setQueryData(bonAppMenuOptions('the-cage').queryKey, {...CAGE_MENU, days: []})
		await renderCage()

		expect(screen.getByText('The Cage has not posted a menu for today.')).toBeTruthy()
		expect(mockFoodMenu).not.toHaveBeenCalled()
	})
})
