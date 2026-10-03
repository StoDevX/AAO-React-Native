import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render} from '@testing-library/react-native'

import {RadioHost} from '../host'
import {useRadioStore} from '../store'

// The native module needs a device; its player is a stand-in that records the
// source it was given.
const mockUseAudioPlayer = jest.fn((_source: string) => ({play: jest.fn(), pause: jest.fn()}))
jest.mock('expo-audio', () => ({
	useAudioPlayer: (source: string) => mockUseAudioPlayer(source),
	useAudioPlayerStatus: () => ({
		playing: false,
		isBuffering: false,
		didJustFinish: false,
		error: null,
	}),
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

		expect(mockUseAudioPlayer).toHaveBeenCalledWith('http://stream.krlx.org:8000/_a')
		expect(screen.toJSON()).toBeNull()
	})

	test('plays a station that only has a page through the web view', async () => {
		mockUseAudioPlayer.mockClear()

		await renderHost()

		expect(mockUseAudioPlayer).not.toHaveBeenCalled()
	})
})
