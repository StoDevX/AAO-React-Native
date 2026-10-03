import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {NativeStreamPlayer} from '../native-player'
import type {PlayState} from '../types'

// The native module needs a device. Its player is a stand-in that records the
// commands it is sent, and its status is set by each test.
const mockPlayer = {play: jest.fn(), pause: jest.fn()}
let mockStatus = {
	playing: false,
	isBuffering: false,
	didJustFinish: false,
	error: null as string | null,
}
const mockSetAudioMode = jest.fn(() => Promise.resolve())

jest.mock('expo-audio', () => ({
	useAudioPlayer: () => mockPlayer,
	useAudioPlayerStatus: () => mockStatus,
	setAudioModeAsync: () => mockSetAudioMode(),
}))

function player(playState: PlayState, callbacks: Record<string, jest.Mock>) {
	return (
		<NativeStreamPlayer
			playState={playState}
			streamSourceUrl="https://s3.voscast.com:10803/stream"
			{...callbacks}
		/>
	)
}

function callbacks() {
	return {
		onPlay: jest.fn(),
		onWaiting: jest.fn(),
		onEnded: jest.fn(),
		onPause: jest.fn(),
		onError: jest.fn(),
	}
}

describe('NativeStreamPlayer', () => {
	beforeEach(() => {
		mockPlayer.play.mockClear()
		mockPlayer.pause.mockClear()
		mockSetAudioMode.mockClear()
		mockStatus = {playing: false, isBuffering: false, didJustFinish: false, error: null}
	})

	test('plays when the radio is starting, and pauses when it is stopped', async () => {
		let cb = callbacks()
		let view = await render(player('checking', cb))
		expect(mockPlayer.play).toHaveBeenCalled()

		await view.rerender(player('paused', cb))
		expect(mockPlayer.pause).toHaveBeenCalled()
	})

	test('keeps playing in the background and in silent mode', async () => {
		await render(player('checking', callbacks()))
		expect(mockSetAudioMode).toHaveBeenCalled()
	})

	test('says nothing before the player does', async () => {
		let cb = callbacks()
		await render(player('checking', cb))
		expect(cb.onPlay).not.toHaveBeenCalled()
		expect(cb.onWaiting).not.toHaveBeenCalled()
		expect(cb.onPause).not.toHaveBeenCalled()
	})

	test('reports playing once audio arrives, and waiting when the buffer runs dry', async () => {
		let cb = callbacks()
		let view = await render(player('checking', cb))

		mockStatus = {...mockStatus, playing: true}
		await view.rerender(player('playing', cb))
		expect(cb.onPlay).toHaveBeenCalledTimes(1)

		mockStatus = {...mockStatus, isBuffering: true}
		await view.rerender(player('playing', cb))
		expect(cb.onWaiting).toHaveBeenCalledTimes(1)
	})

	test('reports a pause the app did not ask for, as when a call interrupts', async () => {
		let cb = callbacks()
		mockStatus = {...mockStatus, playing: true}
		let view = await render(player('playing', cb))

		mockStatus = {...mockStatus, playing: false}
		await view.rerender(player('playing', cb))

		expect(cb.onPause).toHaveBeenCalledTimes(1)
	})

	test('reports the end of the stream', async () => {
		let cb = callbacks()
		let view = await render(player('playing', cb))

		mockStatus = {...mockStatus, didJustFinish: true}
		await view.rerender(player('playing', cb))

		expect(cb.onEnded).toHaveBeenCalledTimes(1)
	})

	test('reports why a play failed', async () => {
		let cb = callbacks()
		let view = await render(player('checking', cb))

		mockStatus = {...mockStatus, error: 'The operation could not be completed.'}
		await view.rerender(player('checking', cb))

		expect(cb.onError).toHaveBeenCalledWith({
			code: 0,
			message: 'The operation could not be completed.',
		})
	})
})
