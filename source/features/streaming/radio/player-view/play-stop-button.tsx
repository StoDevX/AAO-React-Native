import * as React from 'react'
import {AccessibilityInfo, StyleSheet, Text, View} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {SymbolView} from 'expo-symbols'

import {PLAYBACK_ERROR} from '../describe-playback'
import type {Station} from '../stations'
import {offersStop, useRadioStore, useStationPlayback} from '../store'
import {palette} from './palette'

/** Play, or Stop while the station is starting, playing, or has failed. */
export function PlayStopButton({station}: {station: Station}): React.ReactNode {
	let {playState, error} = useStationPlayback(station.id)
	let play = useRadioStore((state) => state.play)
	let stop = useRadioStore((state) => state.stop)
	let running = offersStop(playState, error)
	return (
		<Touchable
			accessibilityLabel={`${running ? 'Stop' : 'Play'} ${station.stationName}`}
			accessibilityRole="button"
			highlight={false}
			onPress={running ? stop : () => play(station.id)}
			style={styles.button}
		>
			<SymbolView
				name={running ? 'pause.fill' : 'play.fill'}
				size={44}
				tintColor={palette.primary}
			/>
		</Touchable>
	)
}

/**
 * "Couldn’t play" under the controls, only while this station's last play
 * failed. White, as the rest of the player is over the tint, and announced, as
 * VoiceOver would otherwise not know the tap on Play came to nothing.
 */
export function PlaybackError({station}: {station: Station}): React.ReactNode {
	let {error} = useStationPlayback(station.id)
	let failed = error !== null

	React.useEffect(() => {
		if (failed) {
			AccessibilityInfo.announceForAccessibility(PLAYBACK_ERROR)
		}
	}, [failed])

	if (!failed) {
		return null
	}
	return (
		<View style={styles.error}>
			<SymbolView name="exclamationmark.triangle.fill" size={15} tintColor={palette.primary} />
			<Text style={[styles.errorText, palette.styles.primary]}>{PLAYBACK_ERROR}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	button: {width: 88, height: 88, alignItems: 'center', justifyContent: 'center'},
	error: {flexDirection: 'row', alignItems: 'center', gap: 6},
	errorText: {fontSize: 15, fontWeight: '600'},
})
