import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider, onlineManager} from '@tanstack/react-query'

import MenuItemDetailPage from '../../../../app/(home)/MenuItemDetail'
import {MenuItemDetailView} from '../../../../modules/food-menu/food-item-detail'
import {bonAppMenuOptions, pauseMenuOptions} from '../query'
import {OFFLINE_MESSAGE} from '../lib/menu-view'
import type {EditedBonAppMenuInfoType, GithubMenuResponse} from '../types'

// The detail view renders `@expo/ui`, which cannot mount under Jest. What the
// screen hands it is read off the call.
jest.mock('../../../../modules/food-menu/food-item-detail', () => ({
	MenuItemDetailView: jest.fn(() => null),
}))

jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

// Every fetch fails, so a test that refetches sees what a 5xx or a captive
// portal would hand the screen.
jest.mock('@frogpond/api', () => ({
	client: {get: jest.fn(() => ({json: () => Promise.reject(new Error('HTTP 503'))}))},
}))

// A Pause item's id is its place in the menu.
const PAUSE_PARAMS = {source: 'pause', itemId: '0'}
let mockParams: Record<string, string> = PAUSE_PARAMS

jest.mock('expo-router', () => ({
	Stack: {Screen: () => null, Title: () => null},
	useLocalSearchParams: () => mockParams,
}))

const mockDetailView = MenuItemDetailView as unknown as jest.Mock<(props: unknown) => null>

/** The Pause's menu as the server answers, with one item on it. */
const PAUSE_RESPONSE = {
	foodItems: [{label: 'Nachos', station: 'Grill'}],
	stationMenus: [{label: 'Grill'}],
	corIcons: {},
} as unknown as GithubMenuResponse

let queryClient: QueryClient

beforeEach(() => {
	jest.useFakeTimers()
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(pauseMenuOptions.queryKey, PAUSE_RESPONSE)
	mockDetailView.mockClear()
	mockParams = PAUSE_PARAMS
})

afterEach(() => {
	onlineManager.setOnline(true)
	queryClient.clear()
	jest.useRealTimers()
})

function renderDetail() {
	return render(
		<QueryClientProvider client={queryClient}>
			<MenuItemDetailPage />
		</QueryClientProvider>,
	)
}

describe('MenuItemDetailPage', () => {
	test('keeps a cached item on screen when its refetch fails', async () => {
		await renderDetail()

		await act(async () => {
			await queryClient.refetchQueries()
			await jest.runOnlyPendingTimersAsync()
		})

		expect(queryClient.getQueryState(pauseMenuOptions.queryKey)?.status).toBe('error')
		expect(screen.queryByText(/HTTP 503/u)).toBeNull()
		expect(mockDetailView.mock.lastCall?.[0]).toMatchObject({item: {label: 'Nachos'}})
	})

	test('says it is offline when nothing is cached and there is no network', async () => {
		queryClient.clear()
		onlineManager.setOnline(false)
		await renderDetail()

		expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy()
	})

	test('says it cannot find an item from a source it does not know', async () => {
		mockParams = {source: 'unknown', itemId: '0'}
		await renderDetail()

		expect(screen.getByText('Could not find this menu item.')).toBeTruthy()
	})

	// Two days' menus can sit in the cache across midnight. The item comes from
	// the one its list was showing.
	test('reads a BonApp item from the menu of the day it was listed on', async () => {
		let menuWith = (label: string, date: string) =>
			({
				items: {'42': {id: '42', label, station: 'Grill', description: ''}},
				cor_icons: {},
				days: [{date, cafe: {name: 'The Cage', menu_id: '1', dayparts: [[]]}}],
			}) as unknown as EditedBonAppMenuInfoType
		queryClient.setQueryData(
			bonAppMenuOptions('the-cage', '2026-09-22').queryKey,
			menuWith('Nachos', '2026-09-22'),
		)
		queryClient.setQueryData(
			bonAppMenuOptions('the-cage', '2026-09-23').queryKey,
			menuWith('Tacos', '2026-09-23'),
		)
		mockParams = {source: 'bonapp', cafe: 'the-cage', day: '2026-09-22', itemId: '42'}
		await renderDetail()

		expect(mockDetailView.mock.lastCall?.[0]).toMatchObject({item: {label: 'Nachos'}})
	})

	// The BonApp Picker names its cafe by id rather than by name, and the item
	// is read from the menu fetched for that id.
	test('reads an item from the menu of a cafe named by id', async () => {
		let menu = {
			items: {'5': {id: '5', label: 'toast', station: 'grill', description: ''}},
			cor_icons: {},
			days: [],
		} as unknown as EditedBonAppMenuInfoType
		queryClient.setQueryData(bonAppMenuOptions({id: '261'}, '2026-09-22').queryKey, menu)
		mockParams = {source: 'bonapp', cafeId: '261', day: '2026-09-22', itemId: '5'}

		await renderDetail()

		expect(mockDetailView.mock.lastCall?.[0]).toMatchObject({item: {label: 'Toast'}})
	})
})
