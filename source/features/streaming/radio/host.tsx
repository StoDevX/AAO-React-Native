import * as React from 'react'
import {StyleSheet} from 'react-native'
import {StreamPlayer} from './player'
import {STATIONS} from './stations'
import {useRadioStore} from './store'

/**
 * The app's one radio player, mounted once at the root so a station keeps
 * playing while the listener moves around the app. It renders nothing until a
 * station is loaded, and a new station gets a new player, so only one ever
 * plays.
 */
export function RadioHost(): React.ReactNode {
	let stationId = useRadioStore((state) => state.stationId)
	let playState = useRadioStore((state) => state.playState)
	let reportPlaying = useRadioStore((state) => state.reportPlaying)
	let reportPaused = useRadioStore((state) => state.reportPaused)
	let reportError = useRadioStore((state) => state.reportError)

	if (!stationId) {
		return null
	}

	let {source} = STATIONS[stationId]

	return (
		<StreamPlayer
			key={stationId}
			embeddedPlayerUrl={source.embeddedPlayerUrl}
			onEnded={reportPaused}
			onError={reportError}
			onPause={reportPaused}
			onPlay={reportPlaying}
			playState={playState}
			streamSourceUrl={source.streamSourceUrl}
			style={styles.hidden}
			useEmbeddedPlayer={source.useEmbeddedPlayer}
		/>
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
})
