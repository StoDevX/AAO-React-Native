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

type HtmlAudioEvent =
	| {type: HtmlAudioState}
	| {type: 'error'; error: HtmlAudioError}
	| {type: 'ready'}

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
			/* An embedded page may build its <audio> after this script runs, so
			 * the element is looked up when it is first needed. */
			var player = null;

			function findPlayer() {
				if (!player) {
					player = document.querySelector('${selector}');
					if (player) {
						listen(player);
					}
				}
				return player;
			}

			/*******
			 *******/

			window.addEventListener('message', function (event) {
				/* Before the <audio> exists there is nothing to act on; the app
				 * sends its state again once "ready" reports it. */
				if (!findPlayer()) {
					return;
				}
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

			/* Tells the app it can control the <audio>. A message sent before
			 * this is lost, so the app waits for it before relying on one. */
			function announceReady() {
				message({type: 'ready'});
			}

			if (findPlayer()) {
				announceReady();
			} else {
				var observer = new MutationObserver(function () {
					if (findPlayer()) {
						observer.disconnect();
						announceReady();
					}
				});
				observer.observe(document.documentElement, {childList: true, subtree: true});
			}

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

			function listen(audio) {
				/* "waiting" is fired when playback has stopped because of a temporary
				 * lack of data. */
				audio.addEventListener('waiting', send);

				/* "ended" is fired when playback or streaming has stopped because the
				 * end of the media was reached or because no further data is
				 * available. */
				audio.addEventListener('ended', send);

				/* "stalled" is fired when the user agent is trying to fetch media data,
				 * but data is unexpectedly not forthcoming. */
				audio.addEventListener('stalled', send);

				/* "playing" is fired when playback is ready to start after having been
				 * paused or delayed due to lack of data. */
				audio.addEventListener('playing', send);

				/* "pause" is fired when playback has been paused. */
				audio.addEventListener('pause', send);

				/* "play" is fired when playback has begun. */
				audio.addEventListener('play', send);

				/* "error" is fired when an error occurs. */
				audio.addEventListener('error', error);
			}
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

	let sendPlayState = useCallback((): void => {
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

	useEffect(() => {
		sendPlayState()
	}, [sendPlayState])

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
				// A cold WebView can take seconds to load its page, and anything
				// sent before then is lost, so send the state again.
				case 'ready':
					return sendPlayState()

				case 'waiting':
					return onWaiting?.()

				case 'ended':
					return onEnded?.()

				case 'stalled':
					return onStalled?.()

				case 'pause':
					return onPause?.()

				// "play" only means play() was called; the stream may never
				// arrive, so wait for "playing".
				case 'playing':
					return onPlay?.()

				case 'error':
					return onError?.(data.error)

				default:
					return
			}
		},
		[sendPlayState, onWaiting, onEnded, onStalled, onPause, onPlay, onError],
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
