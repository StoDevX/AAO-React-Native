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

/** Renders the host and returns a way to post a message from its player's page. */
async function renderHost(): Promise<(type: string) => Promise<void>> {
	let screen = await render(withQueries(<RadioHost />))
	// The host's view wraps the player, whose WebView wraps the native web view.
	let webview = screen.root?.children[0]
	if (typeof webview !== 'object') {
		throw new TypeError('The host rendered no native web view')
	}
	return async (type) => {
		await fireEvent(webview, 'message', {nativeEvent: {data: JSON.stringify({type})}})
	}
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

	test('a stalled fetch leaves a station that is still playing from its buffer playing', async () => {
		let post = await renderHost()

		await post('stalled')

		expect(useRadioStore.getState().playState).toBe('playing')
	})

	test('a dry buffer reads as starting until audio arrives', async () => {
		let post = await renderHost()

		await post('waiting')
		expect(useRadioStore.getState().playState).toBe('starting')

		await post('playing')
		expect(useRadioStore.getState().playState).toBe('playing')
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

	test('plays a station that only has a page through the web view', async () => {
		mockUseAudioPlayer.mockClear()

		await renderHost()

		expect(mockUseAudioPlayer).not.toHaveBeenCalled()
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
