import * as React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider, queryOptions} from '@tanstack/react-query'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

import {HelpdeskList} from '../helpdesk-list'
import type {HelpdeskPageType} from '../page-configs'
import type {HelpdeskItem} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

// The component's own dependency: it hands `helpdeskPageOptions(pageType,
// url)` straight to `useQuery`, so replacing it lets each test drive a real
// `useQuery` through a real lifecycle (loading, error, success) with a
// queryFn under the test's control -- without touching `ky` or `fetch`,
// which query.ts and parse-page.ts already have their own coverage for.
jest.mock('../query', () => ({
	helpdeskPageOptions: jest.fn(),
}))

// The refresh-on-mount addition's only dependency. Mocked here so this suite
// can assert HelpdeskList calls it, without exercising selector-store's own
// network/fetch behaviour, which selector-store.test.ts already covers.
jest.mock('../selector-store', () => ({
	useSelectorConfigStore: {getState: jest.fn()},
}))

import {helpdeskPageOptions} from '../query'
import {useSelectorConfigStore} from '../selector-store'

let mockHelpdeskPageOptions = helpdeskPageOptions as jest.MockedFunction<typeof helpdeskPageOptions>
let mockGetState = useSelectorConfigStore.getState as jest.MockedFunction<
	typeof useSelectorConfigStore.getState
>

function makeItem(overrides: Partial<HelpdeskItem> = {}): HelpdeskItem {
	return {
		type: 'service',
		id: '1',
		title: 'Reset my password',
		href: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/ServiceDet?ID=1',
		snippet: 'Self-service password reset',
		...overrides,
	}
}

/**
 * Mirrors `helpdeskKeys.page` from query.ts (mocked away above, so it isn't
 * importable here) -- typed by its parameters rather than `as const` on a
 * literal, so a call like `testKey('search', url)` widens to `HelpdeskPageType`
 * instead of narrowing to the literal `"search"`.
 */
function testKey(pageType: HelpdeskPageType, url: string) {
	return ['helpdesk', pageType, url] as const
}

/**
 * A `queryFn` that never resolves, for asserting the loading branch -- but
 * that does settle (by rejecting) once React Query aborts it on unmount, so
 * the promise this test leaves behind doesn't dangle past the test itself.
 */
function pendingQueryFn({signal}: {signal: AbortSignal}): Promise<HelpdeskItem[]> {
	return new Promise<HelpdeskItem[]>((_resolve, reject) => {
		signal.addEventListener('abort', () => reject(new Error('aborted')))
	})
}

// Every query left without observers gets a five-minute garbage-collection
// timeout by default, which would otherwise outlive the test run. See
// building-detail.test.tsx for the same concern.
const trackedQueryClients: QueryClient[] = []

afterEach(() => {
	for (let client of trackedQueryClients) {
		client.clear()
	}
	trackedQueryClients.length = 0
	jest.clearAllMocks()
})

// `render` (and its `rerender`) are async under this RTL version -- they
// wrap the mount in `act()`, which itself awaits -- so every call here is
// awaited too. Skipping that raced `screen`/`rerender` against a mount that
// hadn't started yet.
async function renderList(
	queryFn: (context: {signal: AbortSignal}) => Promise<HelpdeskItem[]>,
	overrides: Partial<React.ComponentProps<typeof HelpdeskList>> = {},
) {
	mockHelpdeskPageOptions.mockReturnValue(
		queryOptions({
			queryKey: testKey(overrides.pageType ?? 'search', overrides.url ?? 'https://example.com'),
			queryFn,
		}),
	)

	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)

	let rendered = await render(
		<QueryClientProvider client={client}>
			<HelpdeskList
				onSelect={jest.fn()}
				pageType="search"
				title="Results"
				url="https://example.com"
				{...overrides}
			/>
		</QueryClientProvider>,
	)

	return {client, ...rendered}
}

describe('HelpdeskList', () => {
	test('shows a loading state while the query is in flight', async () => {
		mockGetState.mockReturnValue({
			config: undefined as never,
			// oxlint-disable-next-line require-await
			refresh: jest.fn(async () => undefined),
		})

		await renderList(pendingQueryFn)

		expect(screen.getByText('Loading…')).toBeTruthy()
	})

	test('shows the error message when the query fails', async () => {
		mockGetState.mockReturnValue({
			config: undefined as never,
			// oxlint-disable-next-line require-await
			refresh: jest.fn(async () => undefined),
		})

		// oxlint-disable-next-line require-await
		await renderList(async () => {
			throw new Error('Network down')
		})

		await waitFor(() => expect(screen.getByText('Error: Network down')).toBeTruthy())
	})

	test('shows the empty text when the query resolves with no items', async () => {
		mockGetState.mockReturnValue({
			config: undefined as never,
			// oxlint-disable-next-line require-await
			refresh: jest.fn(async () => undefined),
		})

		// oxlint-disable-next-line require-await
		await renderList(async () => [], {emptyText: 'No results for your search.'})

		await waitFor(() => expect(screen.getByText('No results for your search.')).toBeTruthy())
	})

	test('falls back to a default empty message when none is given', async () => {
		mockGetState.mockReturnValue({
			config: undefined as never,
			// oxlint-disable-next-line require-await
			refresh: jest.fn(async () => undefined),
		})

		// oxlint-disable-next-line require-await
		await renderList(async () => [])

		await waitFor(() => expect(screen.getByText('Nothing found.')).toBeTruthy())
	})

	test('lists every item once the query resolves', async () => {
		mockGetState.mockReturnValue({
			config: undefined as never,
			// oxlint-disable-next-line require-await
			refresh: jest.fn(async () => undefined),
		})

		let items = [
			makeItem({id: '1', title: 'Reset my password'}),
			makeItem({id: '2', title: 'Request new hardware'}),
		]
		// oxlint-disable-next-line require-await
		await renderList(async () => items)

		await waitFor(() => expect(screen.getByText('Reset my password')).toBeTruthy())
		expect(screen.getByText('Request new hardware')).toBeTruthy()
	})

	test('reports the tapped item', async () => {
		mockGetState.mockReturnValue({
			config: undefined as never,
			// oxlint-disable-next-line require-await
			refresh: jest.fn(async () => undefined),
		})

		let item = makeItem()
		let onSelect = jest.fn()
		// oxlint-disable-next-line require-await
		await renderList(async () => [item], {onSelect})

		await waitFor(() => expect(screen.getByText(item.title)).toBeTruthy())
		fireEvent.press(screen.getByText(item.title))

		expect(onSelect).toHaveBeenCalledWith(item)
	})

	test('refreshes the selector config on mount', async () => {
		// oxlint-disable-next-line require-await
		let refresh = jest.fn(async () => undefined)
		mockGetState.mockReturnValue({config: undefined as never, refresh})

		// oxlint-disable-next-line require-await
		await renderList(async () => [])

		await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
	})

	test('invalidates the helpdesk queries once the refresh resolves', async () => {
		let resolveRefresh!: () => void
		let refresh = jest.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveRefresh = resolve
				}),
		)
		mockGetState.mockReturnValue({config: undefined as never, refresh})

		// oxlint-disable-next-line require-await
		let {client} = await renderList(async () => [])
		let invalidateQueries = jest.spyOn(client, 'invalidateQueries')

		await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
		expect(invalidateQueries).not.toHaveBeenCalled()

		// `resolveRefresh` settles the refresh promise, whose `.then()` calls
		// `invalidateQueries` synchronously. But the observer notification that
		// actually updates HelpdeskList's state is scheduled separately by
		// React Query's notifyManager, as a macrotask queued during that same
		// `.then()` -- so a bare `resolveRefresh()` races that macrotask
		// outside of any `act()` scope, producing an intermittent "not
		// wrapped in act(...)" warning. Fake timers let us flush that
		// macrotask -- and any it schedules in turn -- deterministically,
		// inside one `act()`, rather than guessing how many real ticks to
		// await.
		jest.useFakeTimers()
		try {
			resolveRefresh()
			await act(() => jest.advanceTimersByTimeAsync(0))
		} finally {
			jest.useRealTimers()
		}

		expect(invalidateQueries).toHaveBeenCalledWith({queryKey: ['helpdesk']})
	})

	test('does not refresh again on a re-render', async () => {
		// oxlint-disable-next-line require-await
		let refresh = jest.fn(async () => undefined)
		mockGetState.mockReturnValue({config: undefined as never, refresh})

		mockHelpdeskPageOptions.mockReturnValue(
			queryOptions({
				queryKey: testKey('search', 'https://example.com'),
				// oxlint-disable-next-line require-await
				queryFn: async (): Promise<HelpdeskItem[]> => [],
			}),
		)
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		trackedQueryClients.push(client)

		let {rerender} = await render(
			<QueryClientProvider client={client}>
				<HelpdeskList
					onSelect={jest.fn()}
					pageType="search"
					title="Results"
					url="https://example.com"
				/>
			</QueryClientProvider>,
		)

		await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))

		await rerender(
			<QueryClientProvider client={client}>
				<HelpdeskList
					emptyText="Still nothing."
					onSelect={jest.fn()}
					pageType="search"
					title="Results"
					url="https://example.com"
				/>
			</QueryClientProvider>,
		)

		await waitFor(() => expect(screen.getByText('Still nothing.')).toBeTruthy())
		expect(refresh).toHaveBeenCalledTimes(1)
	})
})
