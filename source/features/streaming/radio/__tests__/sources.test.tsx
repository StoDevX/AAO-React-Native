import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {IsRestoringProvider, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react-native'
import {registerCampusServer} from '@frogpond/api'
import {
	CAMPUS_PROPERTY,
	ID_PROPERTY,
	manifestOptions,
	REL_RADIO_PLAYER_PAGE,
	REL_RADIO_STREAM,
	type Jrd,
} from '@frogpond/data-sources'

import {campusById} from '../../../../campuses'
import {shippedStreamUrl, stationSources, useStationSources} from '../sources'
import {STATIONS, type StationId} from '../stations'

const STOLAF_URL = campusById('edu.stolaf').api.defaultUrl

// The manifest is asked for over the network; each test says how that goes.
const mockGet = jest.fn<() => {json: () => Promise<unknown>}>()
jest.mock('@frogpond/api', () => ({
	...(jest.requireActual('@frogpond/api') as object),
	clientFor: () => ({get: () => mockGet()}),
}))

// The app names the manifest's server at boot; these tests boot no app.
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
		expect(stationSources(manifest, 'ksto').streamSourceUrl).toBe(`${STOLAF_URL}radio/ksto.m3u8`)
	})

	// A station whose feeds a campus's own server proxies, as a new campus's
	// station's would be: the address is on that campus's server, not St. Olaf's.
	test("makes a stream proxied by Carleton's server an address on Carleton's server", () => {
		registerCampusServer('edu.carleton', new URL('https://carleton.example.test/v1/'))
		let manifest = manifestWith({
			...link(REL_RADIO_STREAM, 'krlx', 'radio/krlx.m3u8', 'application/vnd.apple.mpegurl'),
			properties: {[ID_PROPERTY]: 'krlx', [CAMPUS_PROPERTY]: 'edu.carleton'},
		})
		expect(stationSources(manifest, 'krlx').streamSourceUrl).toBe(
			'https://carleton.example.test/v1/radio/krlx.m3u8',
		)
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

	test("plays a station the app ships no stream for from its own campus's server", () => {
		expect(stationSources(EMPTY, 'kmnk').streamSourceUrl).toBe(
			'https://example.college.invalid/radio/named/kmnk',
		)
		expect(shippedStreamUrl('kmnk')).toBe('https://example.college.invalid/radio/named/kmnk')
	})

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
