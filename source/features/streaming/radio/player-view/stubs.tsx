import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import * as c from '@frogpond/colors'
import {SymbolView} from 'expo-symbols'

/**
 * Placeholders until the app can host MPVolumeView and AVRoutePickerView, which
 * need native views. See the radio-sheet-volume-airplay follow-up.
 */
export function VolumeSliderStub(): React.ReactNode {
	return (
		<View accessibilityLabel="Volume, unavailable" accessible={true} style={styles.volume}>
			<SymbolView name="speaker.fill" size={14} tintColor={c.tertiaryLabel} />
			<View style={styles.track} />
			<SymbolView name="speaker.wave.3.fill" size={14} tintColor={c.tertiaryLabel} />
		</View>
	)
}

export function AirPlayButtonStub(): React.ReactNode {
	return (
		<View accessibilityLabel="AirPlay, unavailable" accessible={true} style={styles.action}>
			<SymbolView name="airplay.audio" size={24} tintColor={c.tertiaryLabel} />
		</View>
	)
}

const styles = StyleSheet.create({
	volume: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44},
	track: {flex: 1, height: 6, borderRadius: 3, backgroundColor: c.tertiarySystemFill},
	action: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
})
