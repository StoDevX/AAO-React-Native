import * as React from 'react'
import {setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus} from 'expo-audio'

import {audioActivity, type AudioActivity} from './audio-activity'
import type {NowPlayingPresentation} from './now-playing'
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
	/** What the lock screen and Control Center show: the song on air, else the station. */
	nowPlaying: NowPlayingPresentation
	streamSourceUrl: string
}

/** How long a reloading stream may go without buffering before quiet counts as a pause again. */
const RELOAD_TIMEOUT_MS = 10_000

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
	let {playState, nowPlaying, streamSourceUrl} = props
	let {title, artist, albumTitle, artworkUri} = nowPlaying
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
		// The radio may have paused again by the time the session is readied.
		void configureAudioMode().then(() => {
			if (callbacks.current.playState !== 'paused') {
				player.play()
			}
		})
	}, [player, playState])

	// The lock screen and Control Center show the station and its play and
	// pause, which come back as the player going quiet, so reach the store the
	// same way an interruption does.
	// Releasing the player, which unmounting does first, takes it off the lock
	// screen; asking it to as well would fail, as it is already gone.
	let activated = React.useRef(false)
	React.useEffect(() => {
		let metadata = {title, artist, albumTitle, artworkUrl: artworkUri}
		if (activated.current) {
			player.updateLockScreenMetadata(metadata)
			return
		}
		activated.current = true
		player.setActiveForLockScreen(true, metadata, {isLiveStream: true})
	}, [player, title, artist, albumTitle, artworkUri])

	// A paused station keeps its player, and with it the lock screen's entry, but
	// a live stream has nowhere to resume from. So when Control Center plays the
	// paused player, which starts by itself, the stream is loaded again in it,
	// at the live edge. The player is muted while paused, so its old audio is
	// not heard in the meantime, and it is not paused again, which the lock
	// screen would show between two Playings. Only the player starting counts:
	// its status still says playing for a moment after the app pauses it.
	// Where the stream is in loading again. The reloading player flashes playing,
	// goes idle, then buffers before it plays steadily, and the idle moment is
	// not a pause: taking it for one pauses the station, whose own restart then
	// reads as another resume. So until it has buffered and then played, quiet
	// is ignored; a timeout ends that should it never buffer.
	let reload = React.useRef<'none' | 'reloading' | 'buffered'>('none')
	let reloadTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
	let endReload = React.useCallback(() => {
		reload.current = 'none'
		if (reloadTimer.current) {
			clearTimeout(reloadTimer.current)
			reloadTimer.current = null
		}
	}, [])
	React.useEffect(() => endReload, [endReload])
	let wasPlaying = React.useRef(false)
	let isPlaying = status.playing
	React.useEffect(() => {
		let started = isPlaying && !wasPlaying.current
		wasPlaying.current = isPlaying
		if (started && playState === 'paused' && reload.current === 'none') {
			// Now Playing follows the player, which is idle and then buffering for
			// about a second while the stream loads again, so the lock screen shows
			// Paused for that second between two Playings. Leaving the stream in
			// place would avoid it but resume audio as old as the pause was long; the
			// other way is a second player, handed the lock screen once it plays.
			reload.current = 'reloading'
			reloadTimer.current = setTimeout(endReload, RELOAD_TIMEOUT_MS)
			player.replace(streamSourceUrl)
			// oxlint-disable-next-line react/immutability
			player.muted = false
			player.play()
			callbacks.current.onResume?.()
		}
	}, [isPlaying, playState, player, streamSourceUrl, endReload])

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
				if (reload.current === 'buffered') {
					endReload()
				}
				if (callbacks.current.playState !== 'paused') {
					onPlay?.()
				}
				break
			case 'waiting':
				if (reload.current === 'reloading') {
					reload.current = 'buffered'
				}
				onWaiting?.()
				break
			case 'ended':
				onEnded?.()
				break
			case 'error':
				endReload()
				onError?.({code: 0, message: error ?? 'The stream could not be played.'})
				break
			case 'idle':
				// Quiet after playing is a pause the app did not ask for.
				if ((was === 'playing' || was === 'waiting') && reload.current === 'none') {
					onPause?.()
				}
				break
			default:
				break
		}
	}, [activity, error, endReload])

	return null
}
