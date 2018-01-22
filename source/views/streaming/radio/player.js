// @flow

import * as React from 'react'
import {WebView} from 'react-native'
import type {PlayState, HtmlAudioError} from './types'

type Props = {
	playState: PlayState,
	onWaiting?: () => any,
	onEnded?: () => any,
	onStalled?: () => any,
	onPlay?: () => any,
	onPause?: () => any,
	onError?: HtmlAudioError => any,
	style: any,
	useEmbeddedPlayer: boolean,
	embeddedPlayerUrl: string,
	streamSourceUrl: string,
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
	| {type: 'error', error: HtmlAudioError}

export class StreamPlayer extends React.PureComponent<Props> {
	_webview: WebView

	componentWillReceiveProps(nextProps: Props) {
		this.dispatchEvent(nextProps.playState)
	}

	componentWillUnmount() {
		this.pause()
	}

	dispatchEvent = (nextPlayState: PlayState) => {
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

	handleMessage = (event: any) => {
		const data: HtmlAudioEvent = JSON.parse(event.nativeEvent.data)

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

	pause = () => {
		// console.log('sent "pause" message to <audio>')
		this._webview.postMessage('pause')
	}

	play = () => {
		// console.log('sent "play" message to <audio>')
		this._webview.postMessage('play')
	}

	setRef = (ref: WebView) => (this._webview = ref)

	html = (url: string) => `
		<style>body {background-color: white;}</style>
		<title>Radio Stream</title>

		<audio id="player" webkit-playsinline playsinline>
			<source src="${url}" />
		</audio>
	`

	js = (selector: string = 'audio') => `
	    function ready(fn) {
	      if (document.readyState !== 'loading') {
	        fn();
	      } else if (document.addEventListener) {
	        document.addEventListener('DOMContentLoaded', fn);
	      } else {
	        document.attachEvent('onreadystatechange', function () {
	          if (document.readyState !== 'loading') {
	            fn();
	          }
	        });
	      }
	    };

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

	render() {
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
