import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render} from '@testing-library/react-native'

import {RadioHost} from '../host'
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
jest.mock('expo-audio', () => ({
	useAudioPlayer: (source: string) => mockUseAudioPlayer(source),
	useAudioPlayerStatus: () => mockStatus,
	setAudioModeAsync: () => Promise.resolve(),
}))

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
		useRadioStore.setState({stationId: null, playState: 'stopped', error: null, playerKey: 0})
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying(1)
	})

	afterEach(() => {
		mockShow = null
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
})
