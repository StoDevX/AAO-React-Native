import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render} from '@testing-library/react-native'
import {Commands} from 'react-native-webview/lib/RNCWebViewNativeComponent'

import {MutedStationPage} from '../muted-station-page'
import type {PlayState} from '../types'

/** Renders the page and returns a way to post a message from it, and the native web view. */
async function renderPage(playState: PlayState = 'paused') {
	let screen = await render(
		<MutedStationPage
			embeddedPlayerUrl="https://example.com/player"
			playState={playState}
			style={undefined}
		/>,
	)
	// The WebView renders as a wrapping View around the native web view.
	let webview = screen.root?.children[0]
	if (typeof webview !== 'object') {
		throw new TypeError('The page rendered no native web view')
	}
	let post = async (data: unknown) => {
		await fireEvent(webview, 'message', {nativeEvent: {data: JSON.stringify(data)}})
	}
	return {post, rerender: screen.rerender, webview}
}

/** Records each message the page is sent. */
function watchSentMessages(): jest.Mock<(ref: unknown, data: string) => void> {
	return jest.spyOn(Commands, 'postMessage').mockReturnValue(undefined) as jest.Mock<
		(ref: unknown, data: string) => void
	>
}

describe('MutedStationPage', () => {
	test('sends play once the page is ready, when it was asked to play before then', async () => {
		let sent = watchSentMessages()
		let {post} = await renderPage('checking')
		sent.mockClear()

		await post({type: 'ready'})

		expect(sent.mock.calls.map(([, data]) => data)).toEqual(['play'])
	})

	test('does not send play when the page becomes ready while paused', async () => {
		let sent = watchSentMessages()
		let {post} = await renderPage('paused')
		sent.mockClear()

		await post({type: 'ready'})

		expect(sent.mock.calls.map(([, data]) => data)).not.toContain('play')
	})

	test('tells the page to pause when the radio does', async () => {
		let sent = watchSentMessages()
		let {rerender} = await renderPage('playing')
		sent.mockClear()

		await rerender(
			<MutedStationPage
				embeddedPlayerUrl="https://example.com/player"
				playState="paused"
				style={undefined}
			/>,
		)

		expect(sent.mock.calls.map(([, data]) => data)).toEqual(['pause'])
	})

	test('ignores messages that are not the page’s own', async () => {
		let sent = watchSentMessages()
		let {post} = await renderPage('playing')
		sent.mockClear()

		await post('a string from the embedded page')
		await post({notType: 'ready'})

		expect(sent).not.toHaveBeenCalled()
	})

	// The page is only here to be counted; it must never be heard beside the
	// app's own player. The script cannot run under Jest, so this checks that it
	// is the one the page is given.
	test('is given a script that silences the page’s audio', async () => {
		let {webview} = await renderPage('playing')

		expect(String(webview.props.injectedJavaScript)).toContain('player.muted = true')
		expect(String(webview.props.injectedJavaScript)).not.toContain('player.muted = false')
	})
})
