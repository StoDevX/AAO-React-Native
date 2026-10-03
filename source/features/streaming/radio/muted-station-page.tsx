import * as React from 'react'
import {useCallback, useEffect, useRef} from 'react'
import {WebView, WebViewMessageEvent} from 'react-native-webview'
import type {PlayState} from './types'
import {StyleProp, ViewStyle} from 'react-native'

type Props = {
	playState: PlayState
	embeddedPlayerUrl: string
	style: StyleProp<ViewStyle>
}

type PageMessage = {type: 'ready'}

/// Finds the page's <audio>, holds it silent, and plays or pauses it on
/// request. An embedded page may build its <audio> after this script runs, so
/// the element is looked up when it is first needed, and "ready" says when it
/// can be told what to do.
function pageJs(selector: string): string {
	return `
		function ready(fn) {
			if (document.readyState !== 'loading') {
				fn();
			} else if (document.addEventListener) {
				document.addEventListener('DOMContentLoaded', fn);
			}
		}

		ready(function () {
			var player = null;

			function findPlayer() {
				if (!player) {
					player = document.querySelector('${selector}');
				}
				return player;
			}

			/* The page is only here to be listened to by its own analytics; the
			 * app plays the audio itself. */
			function silence() {
				if (findPlayer()) {
					player.muted = true;
				}
			}

			window.addEventListener('message', function (event) {
				/* Before the <audio> exists there is nothing to act on; the app
				 * sends its state again once "ready" reports it. */
				if (!findPlayer()) {
					return;
				}
				silence();
				switch (event.data) {
					case 'play':
						player.play().catch(function () {});
						break;

					case 'pause':
						player.pause();
						break;
				}
			});

			function announceReady() {
				window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ready'}));
			}

			if (findPlayer()) {
				silence();
				announceReady();
			} else {
				var observer = new MutationObserver(function () {
					if (findPlayer()) {
						observer.disconnect();
						silence();
						announceReady();
					}
				});
				observer.observe(document.documentElement, {childList: true, subtree: true});
			}
		});
	`
}

/**
 * A station's own player page, loaded and played with its sound off.
 *
 * DECISION (St. Olaf / KSTO): the station's owner counts listens through the
 * analytics in this page and asked that the app keep loading it. So the page is
 * loaded and played, silently, for as long as a station plays. The audio the
 * listener hears is the app's own player, from the station's stream, which
 * Control Center and AirPlay can see. Do not remove this loader to save
 * bandwidth or the second stream, and do not unmute the page, or the listener
 * hears the station twice. Nothing the page reports is trusted: only the native
 * player says what the station is doing.
 */
export function MutedStationPage(props: Props): React.ReactNode {
	let {playState} = props

	let webview = useRef<WebView | null>(null)

	let sendPlayState = useCallback((): void => {
		switch (playState) {
			case 'paused':
				webview.current?.postMessage('pause')
				return

			case 'loading':
			case 'checking':
			case 'playing':
				webview.current?.postMessage('play')
				return

			default:
				return
		}
	}, [playState])

	useEffect(() => {
		sendPlayState()
	}, [sendPlayState])

	// A cold WebView can take seconds to load its page, and anything sent before
	// then is lost, so the state is sent again when the page says it is ready.
	let handleMessage = useCallback(
		(event: WebViewMessageEvent): void => {
			let parsed: unknown
			try {
				parsed = JSON.parse(event.nativeEvent.data)
			} catch {
				return
			}
			if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
				if ((parsed as PageMessage).type === 'ready') {
					sendPlayState()
				}
			}
		},
		[sendPlayState],
	)

	return (
		<WebView
			ref={webview}
			allowsInlineMediaPlayback={true}
			ignoreSilentHardwareSwitch={true}
			injectedJavaScript={pageJs('audio')}
			mediaPlaybackRequiresUserAction={false}
			onMessage={handleMessage}
			source={{uri: props.embeddedPlayerUrl}}
			style={props.style}
		/>
	)
}
