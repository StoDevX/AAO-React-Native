import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider, onlineManager} from '@tanstack/react-query'

import MenuItemDetailPage from '../../../../app/(home)/MenuItemDetail'
import {MenuItemDetailView} from '../../../../modules/food-menu/food-item-detail'
import {pauseMenuOptions} from '../query'
import {OFFLINE_MESSAGE} from '../lib/menu-view'
import type {GithubMenuResponse} from '../types'

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

jest.mock('expo-router', () => ({
	Stack: {Screen: () => null, Title: () => null},
	// A Pause item's id is its place in the menu.
	useLocalSearchParams: () => ({source: 'pause', itemId: '0'}),
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
})
