import * as React from 'react'
import {setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus} from 'expo-audio'

import {audioActivity, type AudioActivity} from './audio-activity'
import type {HtmlAudioError, PlayState} from './types'

type Props = {
	playState: PlayState
	onWaiting?: () => unknown
	onEnded?: () => unknown
	onPlay?: () => unknown
	onPause?: () => unknown
	onError?: (error: HtmlAudioError) => unknown
	/** What the lock screen and Control Center call the station. */
	stationName: string
	/** The picture Control Center shows with the station. */
	artworkUri: string
	streamSourceUrl: string
}

/// Radio plays over the lock screen and the silent switch, and takes the audio
/// session from other apps, as a call to a station would. Setting it again is
/// harmless, so each player sets it.
function configureAudioMode(): Promise<void> {
	return setAudioModeAsync({
		playsInSilentMode: true,
		shouldPlayInBackground: true,
		interruptionMode: 'doNotMix',
	})
}

/**
 * Plays a station that has a plain stream URL natively, with the same props
 * as `StreamPlayer`, so the radio's host can use either. It renders nothing.
 *
 * It reports what the player does, not what it was asked: audio arriving is
 * `onPlay`, a dry buffer `onWaiting`, and a player that goes quiet on its own,
 * as when a call interrupts it, `onPause`.
 */
export function NativeStreamPlayer(props: Props): React.ReactNode {
	let {playState, stationName, artworkUri, streamSourceUrl} = props
	let player = useAudioPlayer(streamSourceUrl)
	let status = useAudioPlayerStatus(player)
	let activity = audioActivity(status)
	// The latest callbacks, so an event reaches the current ones without the
	// effect below running again each time they change.
	let callbacks = React.useRef(props)
	React.useEffect(() => {
		callbacks.current = props
	})

	React.useEffect(() => {
		if (playState === 'paused') {
			player.pause()
			return
		}
		void configureAudioMode().then(() => player.play())
	}, [player, playState])

	// The lock screen and Control Center show the station and its play and
	// pause, which come back as the player going quiet, so reach the store the
	// same way an interruption does.
	React.useEffect(() => {
		player.setActiveForLockScreen(
			true,
			{title: stationName, artworkUrl: artworkUri},
			{isLiveStream: true},
		)
		return () => player.setActiveForLockScreen(false)
	}, [player, stationName, artworkUri])

	let previous = React.useRef<AudioActivity>('idle')
	let error = status.error
	React.useEffect(() => {
		let was = previous.current
		previous.current = activity
		if (activity === was) {
			return
		}
		let {onPlay, onWaiting, onEnded, onPause, onError} = callbacks.current
		switch (activity) {
			case 'playing':
				onPlay?.()
				break
			case 'waiting':
				onWaiting?.()
				break
			case 'ended':
				onEnded?.()
				break
			case 'error':
				onError?.({code: 0, message: error ?? 'The stream could not be played.'})
				break
			case 'idle':
				// Quiet after playing is a pause the app did not ask for.
				if (was === 'playing' || was === 'waiting') {
					onPause?.()
				}
				break
			default:
				break
		}
	}, [activity, error])

	return null
}
