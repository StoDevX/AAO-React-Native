import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ID_PROPERTY, manifestOptions, REL_RADIO_STREAM, type Jrd} from '@frogpond/data-sources'

import {track} from '../../../telemetry/track'
import {RadioHost as BareRadioHost} from '../host'
import {STATIONS, logoImage} from '../stations'
import {useRadioStore} from '../store'

// The native module needs a device; its player is a stand-in that records the
// source it was given.
const mockPlayer = {
	muted: false,
	play: jest.fn(),
	pause: jest.fn(),
	replace: jest.fn(),
	setActiveForLockScreen: jest.fn(),
}
let mockStatus = {
	playing: false,
	isBuffering: false,
	didJustFinish: false,
	error: null as string | null,
}
const mockUseAudioPlayer = jest.fn((_source: string) => mockPlayer)
// Streams that fail to load. A player's status is asked for straight after its
// source, so the last source given is the one whose status is wanted.
let mockFailingSources = new Set<string>()
let mockLastSource = ''
jest.mock('expo-audio', () => ({
	useAudioPlayer: (source: string) => {
		mockLastSource = source
		return mockUseAudioPlayer(source)
	},
	useAudioPlayerStatus: () =>
		mockFailingSources.has(mockLastSource) ? {...mockStatus, error: 'Cannot Open'} : mockStatus,
	setAudioModeAsync: () => Promise.resolve(),
}))

// What the host counts; the events themselves are tested with the telemetry.
jest.mock('../../../telemetry/track', () => ({track: jest.fn()}))
const mockTrack = track as jest.Mock

// The schedule is asked for over the network; a test says which show it has on.
let mockShow: {title: string} | null = null
jest.mock('../use-station-schedule', () => ({
	useStationSchedule: () => ({current: mockShow, upcoming: [], status: 'ready'}),
}))

// The song on air is asked for over the network, which these tests are not about:
// the feed is read and presented in the tests of `now-playing`. Here the station
// has no song on, and the host passes on the show the schedule has.
jest.mock('../use-now-playing', () => ({
	useNowPlaying: (
		station: (typeof STATIONS)[keyof typeof STATIONS],
		show: {title: string} | null,
	) => {
		let {presentNowPlaying} = jest.requireActual<typeof import('../now-playing')>('../now-playing')
		return presentNowPlaying(null, station, station.logos[0], show)
	},
}))

// The manifest is asked for over the network; here it cannot be had, so the
// stations play from the shipped entries unless a test caches one.
jest.mock('@frogpond/api', () => ({
	...(jest.requireActual('@frogpond/api') as object),
	client: {get: () => ({json: () => Promise.reject(new Error('offline'))})},
}))

let queryClient: QueryClient

/** The host, with the query cache it reads the stations' sources from. */
function RadioHost(): React.ReactNode {
	return (
		<QueryClientProvider client={queryClient}>
			<BareRadioHost />
		</QueryClientProvider>
	)
}

/** Renders the host and returns a way to post a message from the station's page. */
async function renderHost() {
	let screen = await render(<RadioHost />)
	// The page is the one WebView in the host's hidden view, so find its native
	// element by what it is sent: React Native gives it the `message` handler.
	let hidden = screen.root?.children.find((child) => typeof child === 'object')
	if (typeof hidden !== 'object') {
		throw new TypeError('The host rendered no page')
	}
	let webview = hidden.children[0]
	if (typeof webview !== 'object') {
		throw new TypeError('The host rendered no native web view')
	}
	let post = async (data: unknown) => {
		await fireEvent(webview, 'message', {nativeEvent: {data: JSON.stringify(data)}})
	}
	return {screen, post}
}

describe('RadioHost', () => {
	beforeEach(() => {
		queryClient = new QueryClient()
		useRadioStore.setState({stationId: null, playState: 'stopped', error: null, playerKey: 0})
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying(1)
	})

	afterEach(() => {
		mockShow = null
		mockFailingSources = new Set()
		mockTrack.mockClear()
		queryClient.clear()
		mockUseAudioPlayer.mockClear()
	})

	test('plays KSTO natively from its stream, and loads its player page beside it', async () => {
		let {screen} = await renderHost()

		expect(mockUseAudioPlayer).toHaveBeenCalledWith('https://cdn.stobcm.com/ksto/live.m3u8')
		// KSTO's owner counts listens through its page, so the page is loaded too.
		expect(screen.root?.children.length).toBeGreaterThan(0)
	})

	test("takes nothing the station's page reports for the state of the station", async () => {
		let {post} = await renderHost()

		// The page is silent and only there to be counted. Only the native player
		// says what the station is doing.
		await post({type: 'error', error: {code: 4, message: 'gone'}})
		await post({type: 'pause'})
		await post({type: 'ended'})

		expect(useRadioStore.getState()).toMatchObject({
			stationId: 'ksto',
			playState: 'playing',
			error: null,
		})
	})

	test('plays a station with a stream of its own natively, with no web view', async () => {
		useRadioStore.getState().stop()
		useRadioStore.getState().play('krlx')

		let screen = await render(<RadioHost />)

		expect(mockUseAudioPlayer).toHaveBeenCalledWith('https://s3.voscast.com:10803/stream')
		expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(
			true,
			{title: '88.1 KRLX-FM', artworkUrl: logoImage(STATIONS.krlx.logos[0]).uri},
			{isLiveStream: true},
		)
		expect(screen.toJSON()).toBeNull()
	})

	test('starts the paused native station again in its own player when Control Center plays it', async () => {
		mockStatus = {playing: true, isBuffering: false, didJustFinish: false, error: null}
		useRadioStore.getState().stop()
		useRadioStore.getState().play('krlx')
		let screen = await render(<RadioHost />)

		mockStatus = {...mockStatus, playing: false}
		await act(() => useRadioStore.getState().pause())
		await screen.rerender(<RadioHost />)
		let key = useRadioStore.getState().playerKey

		mockStatus = {...mockStatus, playing: true}
		await screen.rerender(<RadioHost />)

		expect(useRadioStore.getState()).toMatchObject({
			stationId: 'krlx',
			playState: 'starting',
			playerKey: key,
		})
		mockStatus = {playing: false, isBuffering: false, didJustFinish: false, error: null}
	})

	test('names the show on air in Control Center when no song is on', async () => {
		mockShow = {title: 'Pitch Perfect'}
		useRadioStore.getState().stop()
		useRadioStore.getState().play('krlx')
		await render(<RadioHost />)

		expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(
			true,
			expect.objectContaining({title: 'Pitch Perfect', artist: '88.1 KRLX-FM'}),
			{isLiveStream: true},
		)
	})

	test('plays on from the stream it started with when a manifest moves the station mid-play', async () => {
		useRadioStore.getState().stop()
		useRadioStore.getState().play('krlx')
		let screen = await render(<RadioHost />)

		let moved: Jrd = {
			subject: 'https://stolaf.edu',
			links: [
				{
					rel: REL_RADIO_STREAM,
					href: 'https://example.test/krlx.mp3',
					type: 'audio/mpeg',
					properties: {[ID_PROPERTY]: 'krlx'},
				},
			],
		}
		await act(() => {
			queryClient.setQueryData(manifestOptions.queryKey, moved)
		})
		await screen.rerender(<RadioHost />)

		expect(mockUseAudioPlayer).not.toHaveBeenCalledWith('https://example.test/krlx.mp3')

		// The next play takes the station from where the manifest now says it is.
		await act(() => useRadioStore.getState().play('krlx'))
		await screen.rerender(<RadioHost />)

		expect(mockUseAudioPlayer).toHaveBeenLastCalledWith('https://example.test/krlx.mp3')
	})

	describe('when the published stream fails to load', () => {
		const SHIPPED_KRLX = 'https://s3.voscast.com:10803/stream'
		const PUBLISHED_KRLX = 'https://example.test/krlx.mp3'

		beforeEach(() => {
			let published: Jrd = {
				subject: 'https://stolaf.edu',
				links: [
					{
						rel: REL_RADIO_STREAM,
						href: PUBLISHED_KRLX,
						type: 'audio/mpeg',
						properties: {[ID_PROPERTY]: 'krlx'},
					},
				],
			}
			queryClient.setQueryData(manifestOptions.queryKey, published)
			useRadioStore.getState().stop()
			useRadioStore.getState().play('krlx')
		})

		test('plays the shipped stream instead, without reporting a failure', async () => {
			mockFailingSources = new Set([PUBLISHED_KRLX])
			await render(<RadioHost />)

			expect(mockUseAudioPlayer).toHaveBeenCalledWith(PUBLISHED_KRLX)
			expect(mockUseAudioPlayer).toHaveBeenLastCalledWith(SHIPPED_KRLX)
			expect(useRadioStore.getState()).toMatchObject({playState: 'starting', error: null})
			expect(mockTrack).toHaveBeenCalledWith({
				name: 'radio.stream.fallback',
				attributes: {station: 'krlx'},
			})
		})

		test('reports the failure when the shipped stream fails too', async () => {
			mockFailingSources = new Set([PUBLISHED_KRLX, SHIPPED_KRLX])
			await render(<RadioHost />)

			expect(useRadioStore.getState()).toMatchObject({
				stationId: 'krlx',
				playState: 'stopped',
				error: {message: 'Cannot Open'},
			})
		})

		test('reports a failure after audio has played, rather than switching streams', async () => {
			mockStatus = {playing: true, isBuffering: false, didJustFinish: false, error: null}
			let screen = await render(<RadioHost />)
			expect(useRadioStore.getState().playState).toBe('playing')

			mockFailingSources = new Set([PUBLISHED_KRLX])
			await screen.rerender(<RadioHost />)

			expect(mockUseAudioPlayer).not.toHaveBeenCalledWith(SHIPPED_KRLX)
			expect(mockTrack).not.toHaveBeenCalledWith(
				expect.objectContaining({name: 'radio.stream.fallback'}),
			)
			expect(useRadioStore.getState()).toMatchObject({
				playState: 'stopped',
				error: {message: 'Cannot Open'},
			})
			mockStatus = {playing: false, isBuffering: false, didJustFinish: false, error: null}
		})
	})
})
