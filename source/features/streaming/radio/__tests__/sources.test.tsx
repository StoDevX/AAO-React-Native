import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {IsRestoringProvider, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react-native'
import {
	ID_PROPERTY,
	manifestOptions,
	REL_RADIO_PLAYER_PAGE,
	REL_RADIO_STREAM,
	type Jrd,
} from '@frogpond/data-sources'

import {stationSources, useStationSources} from '../sources'

// The manifest is asked for over the network; each test says how that goes.
const mockGet = jest.fn<() => {json: () => Promise<unknown>}>()
jest.mock('@frogpond/api', () => ({
	...(jest.requireActual('@frogpond/api') as object),
	client: {get: () => mockGet()},
}))

const EMPTY: Jrd = {subject: 'https://stolaf.edu', links: []}

function manifestWith(...links: Jrd['links']): Jrd {
	return {subject: 'https://stolaf.edu', links}
}

function link(rel: string, id: string, href: string, type: string): Jrd['links'][number] {
	return {rel, href, type, properties: {[ID_PROPERTY]: id}}
}

const MOVED_KSTO = link(
	REL_RADIO_STREAM,
	'ksto',
	'https://example.test/ksto.m3u8',
	'application/vnd.apple.mpegurl',
)

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
	client = new QueryClient({defaultOptions: {queries: {gcTime: Infinity}}})
	restoring = false
	mockGet.mockReturnValue({json: () => Promise.reject(new Error('offline'))})
})

afterEach(() => {
	client.clear()
	jest.clearAllMocks()
})

describe('stationSources', () => {
	test('ships KSTO with its stream and the player page its owner counts listens through', () => {
		expect(stationSources(EMPTY, 'ksto')).toStrictEqual({
			streamSourceUrl: 'https://cdn.stobcm.com/ksto/live.m3u8',
			embeddedPlayerUrl: 'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
			nowPlayingUrl: undefined,
		})
	})

	test('ships KRLX with its stream and its song feed, and no player page', () => {
		expect(stationSources(EMPTY, 'krlx')).toStrictEqual({
			streamSourceUrl: 'https://s3.voscast.com:10803/stream',
			embeddedPlayerUrl: undefined,
			nowPlayingUrl: 'https://content.krlx.org/wp-json/metaradio/v1/stationnow/?station=1',
		})
	})

	test('follows a published stream', () => {
		expect(stationSources(manifestWith(MOVED_KSTO), 'ksto').streamSourceUrl).toBe(
			'https://example.test/ksto.m3u8',
		)
	})

	test('keeps the shipped stream when the published one is in a format this build cannot play', () => {
		let manifest = manifestWith(
			link(REL_RADIO_STREAM, 'ksto', 'https://example.test/ksto.webm', 'audio/webm'),
		)
		expect(stationSources(manifest, 'ksto').streamSourceUrl).toBe(
			'https://cdn.stobcm.com/ksto/live.m3u8',
		)
	})

	test("keeps KSTO's player page when the published manifest leaves it out", () => {
		expect(stationSources(manifestWith(MOVED_KSTO), 'ksto').embeddedPlayerUrl).toBe(
			'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
		)
	})

	test('gives a station a player page the published manifest adds', () => {
		let manifest = manifestWith(
			link(REL_RADIO_PLAYER_PAGE, 'krlx', 'https://example.test/krlx.html', 'text/html'),
		)
		expect(stationSources(manifest, 'krlx').embeddedPlayerUrl).toBe(
			'https://example.test/krlx.html',
		)
	})
})

describe('useStationSources', () => {
	test('starts from the shipped entries when nothing is cached', async () => {
		let {result} = await renderHook(() => useStationSources('ksto'), {wrapper})
		expect(result.current?.streamSourceUrl).toBe('https://cdn.stobcm.com/ksto/live.m3u8')
	})

	test('uses a cached manifest however old, and keeps it when the refresh fails', async () => {
		client.setQueryData(manifestOptions.queryKey, manifestWith(MOVED_KSTO), {updatedAt: 0})

		let {result} = await renderHook(() => useStationSources('ksto'), {wrapper})

		// Stale, so it is asked for again, and that fails.
		await waitFor(() => expect(mockGet).toHaveBeenCalled())
		await waitFor(() =>
			expect(client.getQueryState(manifestOptions.queryKey)?.status).toBe('error'),
		)
		expect(result.current?.streamSourceUrl).toBe('https://example.test/ksto.m3u8')
	})

	test('follows the manifest once one arrives', async () => {
		mockGet.mockReturnValue({json: () => Promise.resolve(manifestWith(MOVED_KSTO))})

		let {result} = await renderHook(() => useStationSources('ksto'), {wrapper})

		await waitFor(() =>
			expect(result.current?.streamSourceUrl).toBe('https://example.test/ksto.m3u8'),
		)
	})

	test('says nothing while the saved cache is still being read back', async () => {
		restoring = true
		let {result} = await renderHook(() => useStationSources('ksto'), {wrapper})
		expect(result.current).toBeUndefined()
	})
})
