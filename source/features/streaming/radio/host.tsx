import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {StreamPlayer} from './player'
import {STATIONS} from './stations'
import {useRadioStore} from './store'
import type {HtmlAudioError, PlayState, RadioPlayState} from './types'

/** The `<audio>` command each radio state needs. */
const PLAYER_STATE: Record<RadioPlayState, PlayState> = {
	stopped: 'paused',
	starting: 'checking',
	playing: 'playing',
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
	let reportError = useRadioStore((state) => state.reportError)

	// Each report names the player it came from, so one being replaced cannot
	// change the state of the one replacing it.
	let onPlay = React.useCallback(() => reportPlaying(playerKey), [reportPlaying, playerKey])
	let onStopped = React.useCallback(() => reportStopped(playerKey), [reportStopped, playerKey])
	let onError = React.useCallback(
		(error: HtmlAudioError) => reportError(playerKey, error),
		[reportError, playerKey],
	)

	if (!stationId) {
		return null
	}

	let {source} = STATIONS[stationId]

	// The WebView's own container takes flex: 1 whatever its style says, so
	// beside the root stack it would claim half the screen. This view holds
	// it to a point instead.
	return (
		<View pointerEvents="none" style={styles.hidden}>
			<StreamPlayer
				key={playerKey}
				embeddedPlayerUrl={source.embeddedPlayerUrl}
				onEnded={onStopped}
				onError={onError}
				onPause={onStopped}
				onPlay={onPlay}
				playState={PLAYER_STATE[playState]}
				streamSourceUrl={source.streamSourceUrl}
				style={styles.fill}
				useEmbeddedPlayer={source.useEmbeddedPlayer}
			/>
		</View>
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
