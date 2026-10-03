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
	/** Control Center played the paused station, which has reloaded the stream to start again. */
	onResume?: () => unknown
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
			// Silent as well, so that Control Center playing the paused player, which
			// starts it with its old buffer before a fresh one replaces it, is not heard.
			// expo-audio's way to mute is this property of the native player.
			// oxlint-disable-next-line react/immutability
			player.muted = true
			player.pause()
			return
		}
		void configureAudioMode().then(() => player.play())
	}, [player, playState])

	// The lock screen and Control Center show the station and its play and
	// pause, which come back as the player going quiet, so reach the store the
	// same way an interruption does.
	// Releasing the player, which unmounting does first, takes it off the lock
	// screen; asking it to as well would fail, as it is already gone.
	React.useEffect(() => {
		player.setActiveForLockScreen(
			true,
			{title: stationName, artworkUrl: artworkUri},
			{isLiveStream: true},
		)
	}, [player, stationName, artworkUri])

	// A paused station keeps its player, and with it the lock screen's entry, but
	// a live stream has nowhere to resume from. So when Control Center plays the
	// paused player, which starts by itself, the stream is loaded again in it,
	// at the live edge. The player is muted while paused, so its old audio is
	// not heard in the meantime, and it is not paused again, which the lock
	// screen would show between two Playings. Only the player starting counts:
	// its status still says playing for a moment after the app pauses it.
	// True from loading the stream again until it plays, or fails. The reloading
	// player is idle for a moment, which is not a pause, and taking it for one
	// pauses the station, whose own restart then reads as another resume.
	let reloading = React.useRef(false)
	let wasPlaying = React.useRef(false)
	let isPlaying = status.playing
	React.useEffect(() => {
		let started = isPlaying && !wasPlaying.current
		wasPlaying.current = isPlaying
		// Playing once the store has acknowledged the resume means the stream has
		// loaded again; the player's own start, which asked for it, does not.
		if (isPlaying && playState !== 'paused') {
			reloading.current = false
		}
		if (started && playState === 'paused' && !reloading.current) {
			reloading.current = true
			player.replace(streamSourceUrl)
			// oxlint-disable-next-line react/immutability
			player.muted = false
			player.play()
			callbacks.current.onResume?.()
		}
	}, [isPlaying, playState, player, streamSourceUrl])

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
				// Audio under a paused station is Control Center playing it, which the
				// effect above answers.
				if (callbacks.current.playState !== 'paused') {
					onPlay?.()
				}
				break
			case 'waiting':
				onWaiting?.()
				break
			case 'ended':
				onEnded?.()
				break
			case 'error':
				reloading.current = false
				onError?.({code: 0, message: error ?? 'The stream could not be played.'})
				break
			case 'idle':
				// Quiet after playing is a pause the app did not ask for.
				if ((was === 'playing' || was === 'waiting') && !reloading.current) {
					onPause?.()
				}
				break
			default:
				break
		}
	}, [activity, error])

	return null
}
