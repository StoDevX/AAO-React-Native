import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'
import type {WebViewProps} from 'react-native-webview'

import {EMBED_ID, SpotifyEmbed} from '../spotify-embed'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('react-native-webview', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./webview-mock') as typeof import('./webview-mock')
})
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

type LoadRequest = Parameters<NonNullable<WebViewProps['onShouldStartLoadWithRequest']>>[0]
type OpenWindowEvent = Parameters<NonNullable<WebViewProps['onOpenWindow']>>[0]

const REF = {kind: 'playlist', id: '5dJFJNxZlxoRbwIgqCTxWk'} as const

/** A top-frame load the player asks for, as WKWebView reports a tapped link. */
function request(url: string): LoadRequest {
	return {
		url,
		isTopFrame: true,
		navigationType: 'click',
		loading: true,
		title: '',
		canGoBack: false,
		canGoForward: false,
		lockIdentifier: 0,
	}
}

/** The props the player's web view was given. */
function player(): WebViewProps {
	return screen.getByTestId(EMBED_ID).props as WebViewProps
}

afterEach(() => {
	jest.clearAllMocks()
})

describe('SpotifyEmbed', () => {
	test("loads Spotify's player for the reference", async () => {
		await render(<SpotifyEmbed spotify={REF} width={320} />)
		expect(player().source).toStrictEqual({
			uri: 'https://open.spotify.com/embed/playlist/5dJFJNxZlxoRbwIgqCTxWk',
		})
	})

	// The wiring of `loadsInPlayer` into the web view.
	test('sends a link tapped in the player to openUrl, and keeps it out of the player', async () => {
		await render(<SpotifyEmbed spotify={REF} width={320} />)
		let track = 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl'

		expect(player().onShouldStartLoadWithRequest?.(request(track))).toBe(false)
		expect(openUrl).toHaveBeenCalledWith(track)
	})

	test("lets the player's own pages load, without opening anything", async () => {
		await render(<SpotifyEmbed spotify={REF} width={320} />)
		let own = 'https://open.spotify.com/embed/playlist/5dJFJNxZlxoRbwIgqCTxWk?utm_source=generator'

		expect(player().onShouldStartLoadWithRequest?.(request(own))).toBe(true)
		expect(openUrl).not.toHaveBeenCalled()
	})

	test('sends a page the player opens in a new window to openUrl', async () => {
		await render(<SpotifyEmbed spotify={REF} width={320} />)
		let album = 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy'

		player().onOpenWindow?.({nativeEvent: {targetUrl: album}} as OpenWindowEvent)

		expect(openUrl).toHaveBeenCalledWith(album)
	})
})
