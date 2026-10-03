import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {track} from '../../telemetry/track'
import {MutedStationPage} from './muted-station-page'
import {NativeStreamPlayer} from './native-player'
import {useNowPlaying} from './use-now-playing'
import {STATIONS, type Station} from './stations'
import {useRadioStore} from './store'
import type {HtmlAudioError, PlayState, RadioPlayState} from './types'

/** What each radio state asks of a player. */
const PLAYER_STATE: Record<RadioPlayState, PlayState> = {
	stopped: 'paused',
	starting: 'checking',
	playing: 'playing',
	paused: 'paused',
}

/**
 * A natively played station, showing the song on air in Control Center when
 * its station publishes one. A component of its own because the song is a hook.
 */
function NativeStation({
	station,
	...player
}: {station: Station} & Omit<
	React.ComponentProps<typeof NativeStreamPlayer>,
	'nowPlaying' | 'streamSourceUrl'
>): React.ReactNode {
	let nowPlaying = useNowPlaying(station)
	return (
		<NativeStreamPlayer
			{...player}
			nowPlaying={nowPlaying}
			streamSourceUrl={station.source.streamSourceUrl}
		/>
	)
}

/**
 * The app's one radio player, mounted once at the root so a station keeps
 * playing while the listener moves around the app. It renders nothing until a
 * station is loaded, and each play gets a new player, so only one ever plays
 * and a retry never reuses a failed one.
 */
export function RadioHost(): React.ReactNode {
	let stationId = useRadioStore((state) => state.stationId)
	let playState = useRadioStore((state) => state.playState)
	let playerKey = useRadioStore((state) => state.playerKey)
	let reportPlaying = useRadioStore((state) => state.reportPlaying)
	let reportStopped = useRadioStore((state) => state.reportStopped)
	let resume = useRadioStore((state) => state.resume)
	let reportWaiting = useRadioStore((state) => state.reportWaiting)
	let reportError = useRadioStore((state) => state.reportError)

	// Only `waiting` marks a dry buffer: `stalled` is the fetch going quiet while
	// the element plays on from its buffer, and nothing follows it to say audio
	// is back.
	// Each report names the player it came from, so one being replaced cannot
	// change the state of the one replacing it.
	let onPlay = React.useCallback(() => reportPlaying(playerKey), [reportPlaying, playerKey])
	let onStopped = React.useCallback(() => reportStopped(playerKey), [reportStopped, playerKey])
	let onWaiting = React.useCallback(() => reportWaiting(playerKey), [reportWaiting, playerKey])
	let onError = React.useCallback(
		(error: HtmlAudioError) => {
			if (stationId) {
				track({name: 'radio.play.error', attributes: {station: stationId}})
			}
			reportError(playerKey, error)
		},
		[reportError, playerKey, stationId],
	)
	// Control Center, or the lock screen, played the paused station.
	let onResume = React.useCallback(() => {
		if (stationId) {
			track({
				name: 'radio.control',
				attributes: {action: 'play', station: stationId, surface: 'system'},
			})
		}
		resume()
	}, [resume, stationId])

	if (!stationId) {
		return null
	}

	let {source} = STATIONS[stationId]

	// Every station plays natively, which iOS can put in Control Center. A station
	// that also has a player page of its own gets it loaded beside, silent.
	return (
		<>
			<NativeStation
				key={playerKey}
				station={STATIONS[stationId]}
				onEnded={onStopped}
				onError={onError}
				onPause={onStopped}
				onPlay={onPlay}
				onResume={onResume}
				onWaiting={onWaiting}
				playState={PLAYER_STATE[playState]}
			/>
			{source.embeddedPlayerUrl ? (
				// DECISION (St. Olaf / KSTO): their player page's analytics count listens,
				// and they asked that the app keep loading it. It plays with its sound
				// off, beside the native player that is heard, and nothing it reports is
				// used. See `MutedStationPage` and the station's `source`. The WebView's
				// own container takes flex: 1 whatever its style says, so beside the root
				// stack it would claim half the screen; this view holds it to a point.
				<View pointerEvents="none" style={styles.hidden}>
					<MutedStationPage
						key={playerKey}
						embeddedPlayerUrl={source.embeddedPlayerUrl}
						playState={PLAYER_STATE[playState]}
						style={styles.fill}
					/>
				</View>
			) : null}
		</>
	)
}

const styles = StyleSheet.create({
	// Out of sight but still mounted: a view with display "none" is never
	// created, so its page would never load.
	hidden: {
		position: 'absolute',
		width: 1,
		height: 1,
		opacity: 0,
	},
	fill: {
		flex: 1,
	},
})
