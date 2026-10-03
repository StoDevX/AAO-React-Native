import * as React from 'react'
import {StyleSheet, Text} from 'react-native'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {SymbolView} from 'expo-symbols'

import type {Station} from '../stations'
import {useRadioStore, useStationPlayback} from '../store'
import {palette} from './palette'

/** Play, or Stop while the station is starting or playing. */
export function PlayStopButton({
	station,
	size,
}: {
	station: Station
	size: 'large' | 'small'
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)
	let play = useRadioStore((state) => state.play)
	let stop = useRadioStore((state) => state.stop)
	let running = playState !== 'stopped'
	let large = size === 'large'
	return (
		<Touchable
			accessibilityLabel={`${running ? 'Stop' : 'Play'} ${station.stationName}`}
			accessibilityRole="button"
			highlight={false}
			onPress={running ? stop : () => play(station.id)}
			style={large ? styles.large : styles.small}
		>
			<SymbolView
				name={running ? 'stop.fill' : 'play.fill'}
				size={large ? 44 : 24}
				tintColor={palette.primary}
			/>
		</Touchable>
	)
}

/** "Couldn’t play" under the controls, only while this station's last play failed. */
export function PlaybackError({station}: {station: Station}): React.ReactNode {
	let {error} = useStationPlayback(station.id)
	return error ? <Text style={styles.error}>Couldn’t play</Text> : null
}

const styles = StyleSheet.create({
	large: {width: 88, height: 88, alignItems: 'center', justifyContent: 'center'},
	small: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
	error: {color: c.orange, fontSize: 15, textAlign: 'center'},
})
