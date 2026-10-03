import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {AirPlayButtonView} from '@frogpond/audio-route'

import {LABEL_MAX_SCALE} from './action-button'
import {palette} from './palette'

/**
 * AirPlay in the bottom row, as the other actions are: the system's picker for
 * the icon, since only it knows which routes there are and which is in use,
 * over its label.
 */
export function AirPlayButton(): React.ReactNode {
	return (
		<View style={styles.slot}>
			<AirPlayButtonView style={styles.picker} tint={palette.primary} />
			<Text
				maxFontSizeMultiplier={LABEL_MAX_SCALE}
				numberOfLines={1}
				style={[styles.label, palette.styles.primary]}
			>
				AirPlay
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	// A quarter of the row, as the other actions are.
	slot: {flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4},
	picker: {width: 44, height: 28},
	label: {fontSize: 13, textAlign: 'center'},
})
