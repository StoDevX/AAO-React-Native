import * as React from 'react'
import {StyleSheet} from 'react-native'
import {RNHostView, VStack} from '@expo/ui/swift-ui'
import {frame} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import {WebView, type WebViewProps} from 'react-native-webview'
import {loadsInPlayer, spotifyEmbedUrl} from './lib/spotify'
import type {SpotifyRef} from './types'

/** The player's height, in points: what the Mess's own pages give it. */
export const EMBED_HEIGHT = 352
/** Names the player, for a UI test. */
export const EMBED_ID = 'mess-playlist-embed'

type LoadRequest = Parameters<NonNullable<WebViewProps['onShouldStartLoadWithRequest']>>[0]
type OpenWindowEvent = Parameters<NonNullable<WebViewProps['onOpenWindow']>>[0]

/** Keeps the player's own loads in it, and sends a page the reader is leaving for to `openUrl`. */
function keepPlayerLoads(request: LoadRequest): boolean {
	if (loadsInPlayer(request)) return true
	openUrl(request.url)
	return false
}

/** A link the player opens in a new window, such as "Open in Spotify", goes to `openUrl` too. */
function openNewWindow(event: OpenWindowEvent): void {
	openUrl(event.nativeEvent.targetUrl)
}

type Props = {spotify: SpotifyRef; width: number}

/**
 * Spotify's own player for a playlist, album or track. `@expo/ui` has no web view, so this
 * is react-native-webview hosted in a fixed frame. The web view itself does not scroll; the
 * player scrolls its own track list.
 */
export function SpotifyEmbed({spotify, width}: Props): React.ReactNode {
	return (
		<VStack modifiers={[frame({width, height: EMBED_HEIGHT})]}>
			<RNHostView matchContents={false}>
				<WebView
					allowsInlineMediaPlayback={true}
					bounces={false}
					onOpenWindow={openNewWindow}
					onShouldStartLoadWithRequest={keepPlayerLoads}
					scrollEnabled={false}
					source={{uri: spotifyEmbedUrl(spotify)}}
					style={[styles.player, {width}]}
					testID={EMBED_ID}
				/>
			</RNHostView>
		</VStack>
	)
}

const styles = StyleSheet.create({
	player: {height: EMBED_HEIGHT, backgroundColor: 'transparent'},
})
