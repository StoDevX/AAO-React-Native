import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, fireEvent, render, waitFor} from '@testing-library/react-native'

import {RadioHost} from '../host'
import {STATIONS} from '../stations'
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

// The song on air is asked for over the network; the station says none is on.
let client: QueryClient
function withQueries(children: React.ReactNode): React.ReactElement {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Waits for the song on air to be asked for, so its answer does not arrive after the test. */
async function untilSongAsked(): Promise<void> {
	await waitFor(() => expect(client.isFetching()).toBe(0))
}

/** Renders the host and returns a way to post a message from the station's page. */
async function renderHost() {
	let screen = await render(withQueries(<RadioHost />))
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
		client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		jest
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({now: null, refreshSecs: 60})))
		useRadioStore.setState({stationId: null, playState: 'stopped', error: null, playerKey: 0})
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying(1)
	})

	test('plays KSTO natively from its stream, and loads its player page beside it', async () => {
		let {screen} = await renderHost()
		await untilSongAsked()

		expect(mockUseAudioPlayer).toHaveBeenCalledWith('https://cdn.stobcm.com/ksto/live.m3u8')
		// KSTO's owner counts listens through its page, so the page is loaded too.
		expect(screen.root?.children.length).toBeGreaterThan(0)
	})

	test("takes nothing the station's page reports for the state of the station", async () => {
		let {post} = await renderHost()
		await untilSongAsked()

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

		let screen = await render(withQueries(<RadioHost />))
		await untilSongAsked()

		expect(mockUseAudioPlayer).toHaveBeenCalledWith('https://s3.voscast.com:10803/stream')
		expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(
			true,
			{title: '88.1 KRLX-FM', artworkUrl: STATIONS.krlx.logos[0].image.uri},
			{isLiveStream: true},
		)
		expect(screen.toJSON()).toBeNull()
	})

	test('starts the paused native station again in its own player when Control Center plays it', async () => {
		mockStatus = {playing: true, isBuffering: false, didJustFinish: false, error: null}
		useRadioStore.getState().stop()
		useRadioStore.getState().play('krlx')
		let screen = await render(withQueries(<RadioHost />))
		await untilSongAsked()

		mockStatus = {...mockStatus, playing: false}
		await act(() => useRadioStore.getState().pause())
		await screen.rerender(withQueries(<RadioHost />))
		let key = useRadioStore.getState().playerKey

		mockStatus = {...mockStatus, playing: true}
		await screen.rerender(withQueries(<RadioHost />))

		expect(useRadioStore.getState()).toMatchObject({
			stationId: 'krlx',
			playState: 'starting',
			playerKey: key,
		})
		mockStatus = {playing: false, isBuffering: false, didJustFinish: false, error: null}
	})
})
