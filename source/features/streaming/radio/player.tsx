import * as React from 'react'
import {useCallback, useEffect, useRef} from 'react'
import {WebView, WebViewMessageEvent} from 'react-native-webview'
import type {HtmlAudioError, PlayState} from './types'
import {StyleProp, ViewStyle} from 'react-native'

type Props = {
	playState: PlayState
	onWaiting?: () => unknown
	onEnded?: () => unknown
	onStalled?: () => unknown
	onPlay?: () => unknown
	onPause?: () => unknown
	onError?: (error: HtmlAudioError) => unknown
	style: StyleProp<ViewStyle>
	useEmbeddedPlayer: boolean
	embeddedPlayerUrl: string
	streamSourceUrl: string
}

type HtmlAudioState = 'waiting' | 'ended' | 'stalled' | 'playing' | 'play' | 'pause'

type HtmlAudioEvent = {type: HtmlAudioState} | {type: 'error'; error: HtmlAudioError}

function playerHtml(url: string): string {
	return `
		<style>body {background-color: white;}</style>
		<title>Radio Stream</title>

		<audio id='player' webkit-playsinline playsinline>
			<source src='${url}' />
		</audio>
	`
}

function playerJs(selector: string): string {
	return `
		function ready(fn) {
			if (document.readyState !== 'loading') {
				fn();
			} else if (document.addEventListener) {
				document.addEventListener('DOMContentLoaded', fn);
			}
		}

		ready(function () {
			var player = document.querySelector('${selector}');

			/*******
			 *******/

			window.addEventListener('message', function (event) {
				switch (event.data) {
					case 'play':
						player.muted = false;
						player.play().catch(error);
						break;

					case 'pause':
						player.pause();
						break;
				}
			});

			/*******
			 *******/

			function message(data) {
				window.ReactNativeWebView.postMessage(JSON.stringify(data));
			}

			function send(event) {
				message({type: event.type});
			}

			/* Called with the <audio> element's error event, or with the
			 * rejection from play(). Only the element's own event describes
			 * player.error; a rejection carries its reason itself, and an older
			 * MediaError may still be set on the element. */
			function error(event) {
				var mediaError = event && event.type === 'error' ? player.error : null;
				message({
					type: 'error',
					error: {
						code: mediaError ? mediaError.code : 0,
						message: mediaError
							? mediaError.message || 'The stream could not be played.'
							: String((event && event.message) || event),
					},
				});
			}

			/*******
			 *******/

			/* "waiting" is fired when playback has stopped because of a temporary
			 * lack of data. */
			player.addEventListener('waiting', send);

			/* "ended" is fired when playback or streaming has stopped because the
			 * end of the media was reached or because no further data is
			 * available. */
			player.addEventListener('ended', send);

			/* "stalled" is fired when the user agent is trying to fetch media data,
			 * but data is unexpectedly not forthcoming. */
			player.addEventListener('stalled', send);

			/* "playing" is fired when playback is ready to start after having been
			 * paused or delayed due to lack of data. */
			player.addEventListener('playing', send);

			/* "pause" is fired when playback has been paused. */
			player.addEventListener('pause', send);

			/* "play" is fired when playback has begun. */
			player.addEventListener('play', send);

			/* "error" is fired when an error occurs. */
			player.addEventListener('error', error);
		});
	`
}

export function StreamPlayer(props: Props): React.ReactNode {
	let {playState, onWaiting, onEnded, onStalled, onPause, onPlay, onError} = props

	let webview = useRef<WebView | null>(null)

	let pausePlayback = useCallback((): void => {
		// console.log('sent "pause" message to <audio>')
		webview.current?.postMessage('pause')
	}, [webview])

	let beginPlayback = useCallback((): void => {
		// console.log('sent "play" message to <audio>')
		webview.current?.postMessage('play')
	}, [webview])

	useEffect(() => {
		return () => {
			pausePlayback()
		}
	}, [pausePlayback])

	useEffect(() => {
		// console.log('<StreamPlayer> state changed to', playState)

		switch (playState) {
			case 'paused':
				return pausePlayback()

			case 'loading':
			case 'checking':
			case 'playing':
				return beginPlayback()

			default:
				return
		}
	}, [pausePlayback, beginPlayback, playState])

	let handleMessage = useCallback(
		(event: WebViewMessageEvent): unknown => {
			// An embedded page can post messages of its own, which need not be
			// ours, JSON, or even an object.
			let parsed: unknown
			try {
				parsed = JSON.parse(event.nativeEvent.data)
			} catch {
				return
			}
			if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
				return
			}
			let data = parsed as HtmlAudioEvent

			// console.log('<audio> dispatched event', data.type)

			switch (data.type) {
				case 'waiting':
					return onWaiting?.()

				case 'ended':
					return onEnded?.()

				case 'stalled':
					return onStalled?.()

				case 'pause':
					return onPause?.()

				case 'playing':
				case 'play':
					return onPlay?.()

				case 'error':
					return onError?.(data.error)

				default:
					return
			}
		},
		[onWaiting, onEnded, onStalled, onPause, onPlay, onError],
	)

	return (
		<WebView
			ref={webview}
			allowsInlineMediaPlayback={true}
			ignoreSilentHardwareSwitch={true}
			injectedJavaScript={playerJs('audio')}
			mediaPlaybackRequiresUserAction={false}
			onMessage={handleMessage}
			// > Note that [a static HTML source] will require setting originWhitelist to ["*"].
			originWhitelist={['*']}
			source={
				props.useEmbeddedPlayer
					? {uri: props.embeddedPlayerUrl}
					: {html: playerHtml(props.streamSourceUrl)}
			}
			style={props.style}
		/>
	)
}
