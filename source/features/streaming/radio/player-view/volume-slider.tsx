import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {VolumeSliderView} from '@frogpond/audio-route'
import {SymbolView} from 'expo-symbols'

import {palette} from './palette'

/**
 * The two speakers are drawn at different sizes because the symbols are:
 * the loud one's glyph is the shorter at a given size, and at the same size
 * the pair would not match as Music's does.
 */
const QUIET_SIZE = 15
const LOUD_SIZE = 22

/** Music's volume row: the system slider between a quiet and a loud speaker. */
export function VolumeSlider(): React.ReactNode {
	return (
		<View style={styles.row}>
			<SymbolView name="speaker.fill" size={QUIET_SIZE} tintColor={palette.secondary} />
			<VolumeSliderView style={styles.slider} tint={palette.primary} trackTint={palette.track} />
			<SymbolView name="speaker.wave.3.fill" size={LOUD_SIZE} tintColor={palette.secondary} />
		</View>
	)
}

const styles = StyleSheet.create({
	// Insets measured from Music's: its speakers sit a little further in than the
	// player's edge, and less far on the left, where the quiet speaker is narrower.
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		minHeight: 44,
		marginLeft: 3,
		marginRight: 5,
	},
	slider: {flex: 1, height: 44},
})
