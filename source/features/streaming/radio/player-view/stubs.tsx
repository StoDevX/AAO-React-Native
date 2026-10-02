import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {SymbolView} from 'expo-symbols'

import {usePalette} from './palette'

/**
 * Placeholders until the app can host MPVolumeView and AVRoutePickerView, which
 * need native views. See the radio-sheet-volume-airplay follow-up.
 */
export function VolumeSliderStub(): React.ReactNode {
	let palette = usePalette()
	return (
		<View accessibilityLabel="Volume, unavailable" accessible={true} style={styles.volume}>
			<SymbolView name="speaker.fill" size={14} tintColor={palette.tertiary} />
			<View style={[styles.track, palette.styles.track]} />
			<SymbolView name="speaker.wave.3.fill" size={14} tintColor={palette.tertiary} />
		</View>
	)
}

export function AirPlayButtonStub(): React.ReactNode {
	let palette = usePalette()
	return (
		<View accessibilityLabel="AirPlay, unavailable" accessible={true} style={styles.action}>
			<SymbolView name="airplay.audio" size={24} tintColor={palette.tertiary} />
		</View>
	)
}

const styles = StyleSheet.create({
	volume: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44},
	track: {flex: 1, height: 6, borderRadius: 3},
	action: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
})
