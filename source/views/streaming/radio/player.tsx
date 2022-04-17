import * as React from 'react'
import {WebView} from 'react-native-webview'
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

type HtmlAudioState =
	| 'waiting'
	| 'ended'
	| 'stalled'
	| 'playing'
	| 'play'
	| 'pause'

type HtmlAudioEvent =
	| {type: HtmlAudioState}
	| {type: 'error'; error: HtmlAudioError}

export class StreamPlayer extends React.PureComponent<Props> {
	componentDidUpdate(): void {
		this.dispatchEvent(this.props.playState)
	}

	componentWillUnmount(): void {
		this.pause()
	}

	_webview: WebView | null = null

	dispatchEvent = (nextPlayState: PlayState): void => {
		// console.log('<StreamPlayer> state changed to', nextPlayState)

		switch (nextPlayState) {
			case 'paused':
				return this.pause()

			case 'loading':
			case 'checking':
			case 'playing':
				return this.play()

			default:
				return
		}
	}

	handleMessage = (event: any): unknown => {
		let data: HtmlAudioEvent = JSON.parse(event.nativeEvent.data)

		// console.log('<audio> dispatched event', data.type)

		switch (data.type) {
			case 'waiting':
				return this.props.onWaiting && this.props.onWaiting()

			case 'ended':
				return this.props.onEnded && this.props.onEnded()

			case 'stalled':
				return this.props.onStalled && this.props.onStalled()

			case 'pause':
				return this.props.onPause && this.props.onPause()

			case 'playing':
			case 'play':
				return this.props.onPlay && this.props.onPlay()

			case 'error':
				return this.props.onError && this.props.onError(data.error)

			default:
				return
		}
	}

	pause = (): void => {
		// console.log('sent "pause" message to <audio>')
		this._webview && this._webview.postMessage('pause')
	}

	play = (): void => {
		// console.log('sent "play" message to <audio>')
		this._webview && this._webview.postMessage('play')
	}

	setRef = (ref: WebView): WebView => (this._webview = ref)

	html = (url: string): string => `
		<style>body {background-color: white;}</style>
		<title>Radio Stream</title>

		<audio id="player" webkit-playsinline playsinline>
			<source src="${url}" />
		</audio>
	`

	js = (selector = 'audio'): string => `
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

	      document.addEventListener('message', function (event) {
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
	        window.postMessage(JSON.stringify(data));
	      }

	      function send(event) {
	        message({type: event.type});
	      }

	      function error(event) {
	        message({
	          type: event.type,
	          error: 'error',
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

	render(): JSX.Element {
		return (
			<WebView
				ref={this.setRef}
				allowsInlineMediaPlayback={true}
				injectedJavaScript={this.js()}
				mediaPlaybackRequiresUserAction={false}
				onMessage={this.handleMessage}
				source={
					this.props.useEmbeddedPlayer
						? {uri: this.props.embeddedPlayerUrl}
						: {html: this.html(this.props.streamSourceUrl)}
				}
				style={this.props.style}
			/>
		)
	}
}
