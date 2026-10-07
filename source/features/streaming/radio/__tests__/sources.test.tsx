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

import {DEFAULT_URL} from '../../../../lib/constants'
import {stationSources, useStationSources} from '../sources'
import {STATIONS, type StationId} from '../stations'

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
	test('follows a published stream', () => {
		expect(stationSources(manifestWith(MOVED_KSTO), 'ksto').streamSourceUrl).toBe(
			'https://example.test/ksto.m3u8',
		)
	})

	test("keeps KSTO's player page when the published manifest leaves it out", () => {
		expect(stationSources(manifestWith(MOVED_KSTO), 'ksto').embeddedPlayerUrl).toBe(
			'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
		)
	})

	// The player, the web view and `fetch` are all handed what they are given;
	// none of them knows the server a relative address names.
	test('makes a proxied stream an address on the server', () => {
		let manifest = manifestWith(
			link(REL_RADIO_STREAM, 'ksto', 'radio/ksto.m3u8', 'application/vnd.apple.mpegurl'),
		)
		expect(stationSources(manifest, 'ksto').streamSourceUrl).toBe(`${DEFAULT_URL}radio/ksto.m3u8`)
	})

	test("keeps KSTO's shipped player page when the published one is on another site", () => {
		let manifest = manifestWith(
			link(REL_RADIO_PLAYER_PAGE, 'ksto', 'https://example.test/ksto.html', 'text/html'),
		)
		expect(stationSources(manifest, 'ksto').embeddedPlayerUrl).toBe(
			'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
		)
	})

	// The manifest's schema accepts these, and `URL` throws on each.
	test.each(['https://host:99999/stream', 'https://[bad/'])(
		'keeps the shipped stream and page when the published ones are %s',
		(href) => {
			let manifest = manifestWith(
				link(REL_RADIO_STREAM, 'ksto', href, 'application/vnd.apple.mpegurl'),
				link(REL_RADIO_PLAYER_PAGE, 'ksto', href, 'text/html'),
			)
			expect(stationSources(manifest, 'ksto')).toMatchObject({
				streamSourceUrl: 'https://cdn.stobcm.com/ksto/live.m3u8',
				embeddedPlayerUrl: 'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
			})
		},
	)

	test("keeps KSTO's shipped player page when the published one is not over HTTPS", () => {
		let manifest = manifestWith(
			link(REL_RADIO_PLAYER_PAGE, 'ksto', 'http://www.stolaf.edu/ksto.html', 'text/html'),
		)
		expect(stationSources(manifest, 'ksto').embeddedPlayerUrl).toBe(
			'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
		)
	})

	test('gives a station no player page the published manifest puts on another site', () => {
		let manifest = manifestWith(
			link(REL_RADIO_PLAYER_PAGE, 'krlx', 'https://example.test/krlx.html', 'text/html'),
		)
		expect(stationSources(manifest, 'krlx').embeddedPlayerUrl).toBeUndefined()
	})

	// Throwing here would take down the root layout, where the radio is mounted.
	test.each(Object.keys(STATIONS) as StationId[])(
		'ships %s with a stream it can play, and any page on a site a page may be',
		(stationId) => {
			let {streamSourceUrl, embeddedPlayerUrl} = stationSources(EMPTY, stationId)
			expect(streamSourceUrl).toMatch(/^https:\/\//u)
			if (embeddedPlayerUrl !== undefined) {
				expect(embeddedPlayerUrl).toMatch(/^https:\/\/www\.stolaf\.edu\//u)
			}
		},
	)

	test('gives a station a player page the published manifest adds', () => {
		let manifest = manifestWith(
			link(REL_RADIO_PLAYER_PAGE, 'krlx', 'https://www.stolaf.edu/krlx.html', 'text/html'),
		)
		expect(stationSources(manifest, 'krlx').embeddedPlayerUrl).toBe(
			'https://www.stolaf.edu/krlx.html',
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

	test('says nothing while the saved cache is still being read back', async () => {
		restoring = true
		let {result} = await renderHook(() => useStationSources('ksto'), {wrapper})
		expect(result.current).toBeUndefined()
	})
})
