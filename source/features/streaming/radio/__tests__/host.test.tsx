import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render} from '@testing-library/react-native'

import {RadioHost} from '../host'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

// The native module needs a device; its player is a stand-in that records the
// source it was given.
const mockPlayer = {play: jest.fn(), pause: jest.fn(), setActiveForLockScreen: jest.fn()}
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

/** Renders the host and returns a way to post a message from its player's page. */
async function renderHost(): Promise<(type: string) => Promise<void>> {
	let screen = await render(<RadioHost />)
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

		let screen = await render(<RadioHost />)

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

	test('starts the stream afresh when Control Center plays the paused native station', async () => {
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

		// A fresh player was asked for; the stand-in then plays at once, as every
		// one of its players does.
		expect(useRadioStore.getState()).toMatchObject({stationId: 'krlx', playerKey: key + 1})
		mockStatus = {playing: false, isBuffering: false, didJustFinish: false, error: null}
	})
})
