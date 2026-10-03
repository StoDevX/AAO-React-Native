import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {VolumeSliderView} from '@frogpond/audio-route'
import {SymbolView} from 'expo-symbols'

import {palette} from './palette'

/** Music's volume row: the system slider between a quiet and a loud speaker. */
export function VolumeSlider(): React.ReactNode {
	return (
		<View style={styles.row}>
			<SymbolView name="speaker.fill" size={14} tintColor={palette.tertiary} />
			<VolumeSliderView style={styles.slider} tint={palette.primary} />
			<SymbolView name="speaker.wave.3.fill" size={14} tintColor={palette.tertiary} />
		</View>
	)
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44},
	slider: {flex: 1, height: 44},
})
