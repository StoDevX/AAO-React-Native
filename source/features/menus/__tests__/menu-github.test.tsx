import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {FoodMenu} from '@frogpond/food-menu'

import {GitHubHostedMenu} from '../menu-github'
import {usePublishMenuHeader} from '../menu-header'
import {pauseMenuOptions} from '../query'
import {buildingByNameOptions} from '../../building-hours/query'
import {PAUSE_VENUE} from '../lib/cafe-hours'
import type {BuildingType} from '../../building-hours/types'

// The header is the thing under test, so what the screen publishes is read
// straight off the call rather than through the SwiftUI title that draws it.
jest.mock('../menu-header', () => ({usePublishMenuHeader: jest.fn()}))

// The menu body renders `@expo/ui`, which cannot mount under Jest. What the
// screen hands it is read off the call.
jest.mock('@frogpond/food-menu', () => ({FoodMenu: jest.fn(() => null)}))

// The suite-wide setup runs as a UI test, whose clock is frozen and never
// ticks -- which is the one thing this file is about.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

// One router for the whole run, as expo-router's own hook hands back.
const mockRouter = {navigate: jest.fn()}

jest.mock('expo-router', () => ({
	useIsFocused: () => true,
	useRouter: () => mockRouter,
}))

const mockPublish = usePublishMenuHeader as jest.MockedFunction<typeof usePublishMenuHeader>
const mockFoodMenu = FoodMenu as unknown as jest.Mock<
	(props: {now: unknown; onItemPress: unknown}) => null
>

/** The Pause Kitchen as `data/building-hours/1-2-pause-kitchen.yaml` has it. */
const PAUSE: BuildingType = {
	name: PAUSE_VENUE,
	category: 'Food',
	schedule: [
		{
			title: 'Hours',
			hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], from: '4:00pm', to: '12:00am'}],
		},
	],
}

let queryClient: QueryClient

beforeEach(() => {
	// Half a minute before the Pause opens, in campus time.
	jest.useFakeTimers({now: new Date('2026-09-22T20:59:30Z')})

	// Seeded fresh, so no query refetches through a network Jest does not have.
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(pauseMenuOptions.queryKey, {
		foodItems: [],
		stationMenus: [],
		corIcons: {},
	})
	queryClient.setQueryData(buildingByNameOptions('stolaf', PAUSE_VENUE).queryKey, [PAUSE])
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

describe('GitHubHostedMenu', () => {
	// The line under the name is relative to the clock -- `Opens at 4 PM` is
	// false a minute after four -- and a tab stays mounted for as long as the
	// reader keeps coming back to it, so the screen has to follow the clock
	// rather than read it once.
	test('moves the line under the name on as the clock turns over', async () => {
		await render(
			<QueryClientProvider client={queryClient}>
				<GitHubHostedMenu loadingMessage={['Loading…']} name={PAUSE_VENUE} venue={PAUSE_VENUE} />
			</QueryClientProvider>,
		)

		expect(lastHeader()).toMatchObject({closed: true, reopening: 'Opens at 4 PM'})

		await act(async () => {
			await jest.advanceTimersByTimeAsync(60_000)
		})

		expect(lastHeader()).toMatchObject({
			closed: false,
			time: 'Closes at midnight',
			reopening: null,
		})
	})

	// Only the header needs the minute. A tick leaves what the menu body is
	// handed as it was, so the body is not rebuilt.
	test('keeps the menu body off the per-minute tick', async () => {
		await render(
			<QueryClientProvider client={queryClient}>
				<GitHubHostedMenu loadingMessage={['Loading…']} name={PAUSE_VENUE} venue={PAUSE_VENUE} />
			</QueryClientProvider>,
		)

		let first = mockFoodMenu.mock.calls[0]?.[0]
		expect(first).toBeDefined()

		await act(async () => {
			await jest.advanceTimersByTimeAsync(60_000)
		})

		let last = mockFoodMenu.mock.lastCall?.[0]
		expect(last?.now).toBe(first?.now)
		expect(last?.onItemPress).toBe(first?.onItemPress)
	})
})
