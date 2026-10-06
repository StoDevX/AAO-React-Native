import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {IsRestoringProvider, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {
	fetchSourceBody,
	ID_PROPERTY,
	manifestOptions,
	REL_RADIO_NOW_PLAYING,
	type Jrd,
} from '@frogpond/data-sources'

import {STATIONS} from '../stations'
import {useRadioStore} from '../store'
import {useNowPlaying} from '../use-now-playing'

// The feed is asked for through `fetchSourceBody`; a test says what it answers.
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchSourceBody: jest.fn(),
}))
// The manifest is asked for over the network; here it cannot be had, so the
// feed is the shipped one unless a test caches a manifest.
jest.mock('@frogpond/api', () => ({
	...(jest.requireActual('@frogpond/api') as object),
	client: {get: () => ({json: () => Promise.reject(new Error('offline'))})},
}))

const mockFetchSourceBody = fetchSourceBody as jest.Mock<typeof fetchSourceBody>

const SHIPPED_FEED = 'https://content.krlx.org/wp-json/metaradio/v1/stationnow/?station=1'
const SONG = {now: {title: 'Silence Is Golden', artist: 'The Beths'}, refreshSecs: 120}

let client: QueryClient
let restoring = false

function wrapper({children}: {children: React.ReactNode}) {
	return (
		<QueryClientProvider client={client}>
			<IsRestoringProvider value={restoring}>{children}</IsRestoringProvider>
		</QueryClientProvider>
	)
}

beforeEach(() => {
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	restoring = false
	mockFetchSourceBody.mockResolvedValue(SONG)
	useRadioStore.setState({stationId: null, playState: 'stopped', error: null, playerKey: 0})
	useRadioStore.getState().play('krlx')
})

afterEach(() => {
	client.clear()
	jest.clearAllMocks()
})

describe('useNowPlaying', () => {
	test("shows the song on air from KRLX's shipped feed", async () => {
		let {result} = await renderHook(() => useNowPlaying(STATIONS.krlx), {wrapper})

		await waitFor(() => expect(result.current.title).toBe('Silence Is Golden'))
		expect(mockFetchSourceBody).toHaveBeenCalledWith(
			SHIPPED_FEED,
			expect.any(AbortSignal),
			'now playing',
		)
	})

	test('asks the feed the manifest names, once it has moved', async () => {
		let moved: Jrd = {
			subject: 'https://stolaf.edu',
			links: [
				{
					rel: REL_RADIO_NOW_PLAYING,
					href: 'radio/krlx/now',
					type: 'application/vnd.metaradio.stationnow+json',
					properties: {[ID_PROPERTY]: 'krlx'},
				},
			],
		}
		let {result} = await renderHook(() => useNowPlaying(STATIONS.krlx), {wrapper})
		await waitFor(() => expect(result.current.isSong).toBe(true))

		await act(() => {
			client.setQueryData(manifestOptions.queryKey, moved)
		})

		// A relative feed is handed on as it is: `fetchSourceBody` asks ccc-server.
		await waitFor(() =>
			expect(mockFetchSourceBody).toHaveBeenLastCalledWith(
				'radio/krlx/now',
				expect.any(AbortSignal),
				'now playing',
			),
		)
	})

	test('asks for nothing while the saved cache is still being read back', async () => {
		restoring = true
		let {result} = await renderHook(() => useNowPlaying(STATIONS.krlx), {wrapper})

		expect(result.current.isSong).toBe(false)
		expect(mockFetchSourceBody).not.toHaveBeenCalled()
	})

	test('asks for nothing for a station with no feed', async () => {
		useRadioStore.getState().play('ksto')
		await renderHook(() => useNowPlaying(STATIONS.ksto), {wrapper})

		expect(mockFetchSourceBody).not.toHaveBeenCalled()
	})
})
