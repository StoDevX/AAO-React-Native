import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {FoodMenu} from '@frogpond/food-menu'

import {BonAppHostedMenu} from '../menu-bonapp'
import {usePublishMenuHeader} from '../menu-header'
import {bonAppCafeOptions, bonAppMenuOptions} from '../query'
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
	queryClient.clear()
	jest.useRealTimers()
})

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
})
