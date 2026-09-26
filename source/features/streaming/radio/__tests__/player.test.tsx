import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render} from '@testing-library/react-native'
import {Commands} from 'react-native-webview/lib/RNCWebViewNativeComponent'

import {StreamPlayer} from '../player'
import type {PlayState} from '../types'

type Callbacks = {
	onPlay: jest.Mock<() => void>
	onPause: jest.Mock<() => void>
	onError: jest.Mock<(error: {code: number; message: string}) => void>
}

/** Renders the player and returns a way to post a message from its page. */
async function renderPlayer(
	playState: PlayState = 'paused',
): Promise<Callbacks & {post: (data: unknown) => Promise<void>}> {
	let callbacks: Callbacks = {
		onPlay: jest.fn(),
		onPause: jest.fn(),
		onError: jest.fn(),
	}
	let screen = await render(
		<StreamPlayer
			embeddedPlayerUrl=""
			playState={playState}
			streamSourceUrl="https://example.com/stream"
			style={undefined}
			useEmbeddedPlayer={false}
			{...callbacks}
		/>,
	)
	// The WebView renders as a wrapping View around the native web view.
	let webview = screen.root?.children[0]
	if (typeof webview !== 'object' || webview === undefined) {
		throw new Error('The player rendered no native web view')
	}
	let post = async (data: unknown) => {
		await fireEvent(webview, 'message', {nativeEvent: {data: JSON.stringify(data)}})
	}
	return {...callbacks, post}
}

/** Records each message the player sends into its page. */
function watchSentMessages(): jest.Mock<(ref: unknown, data: string) => void> {
	return jest.spyOn(Commands, 'postMessage').mockReturnValue(undefined) as jest.Mock<
		(ref: unknown, data: string) => void
	>
}

describe('StreamPlayer', () => {
	test('sends play once the page is ready, when it was asked to play before then', async () => {
		let sent = watchSentMessages()
		let {post} = await renderPlayer('checking')
		sent.mockClear()

		await post({type: 'ready'})

		expect(sent.mock.calls.map(([, data]) => data)).toEqual(['play'])
	})

	test('does not send play when the page becomes ready while paused', async () => {
		let sent = watchSentMessages()
		let {post} = await renderPlayer('paused')
		sent.mockClear()

		await post({type: 'ready'})

		expect(sent.mock.calls.map(([, data]) => data)).not.toContain('play')
	})

	test('does not report playing when the page has only asked the audio to play', async () => {
		let {onPlay, post} = await renderPlayer()

		await post({type: 'play'})

		expect(onPlay).not.toHaveBeenCalled()
	})

	test('reports playing once audio is actually playing', async () => {
		let {onPlay, post} = await renderPlayer()

		await post({type: 'playing'})

		expect(onPlay).toHaveBeenCalledTimes(1)
	})

	test('reports the pause the page sends', async () => {
		let {onPause, post} = await renderPlayer()

		await post({type: 'pause'})

		expect(onPause).toHaveBeenCalledTimes(1)
	})

	test('passes the page’s error through', async () => {
		let {onError, post} = await renderPlayer()

		await post({type: 'error', error: {code: 4, message: 'Not found'}})

		expect(onError).toHaveBeenCalledWith({code: 4, message: 'Not found'})
	})

	test('ignores messages that are not the player’s own', async () => {
		let {onPlay, onPause, onError, post} = await renderPlayer()

		await post('a string from the embedded page')
		await post({notType: 'playing'})

		expect(onPlay).not.toHaveBeenCalled()
		expect(onPause).not.toHaveBeenCalled()
		expect(onError).not.toHaveBeenCalled()
	})
})
