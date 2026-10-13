import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {AirPlayButtonView} from '@frogpond/audio-route'

import {LABEL_MAX_SCALE} from './action-button'
import {palette} from './palette'
import {TAP_TARGET} from '../../../../lib/tap-target'

/** The height the other actions give their icon, which the picker's icon lines up with. */
const ICON_BOX = 24

/**
 * AirPlay in the bottom row, as the other actions are: the system's picker for
 * the icon, since only it knows which routes there are and which is in use,
 * over its label. The picker is taller than the icon it draws, centred on the
 * space the other actions' icons take, so it can be tapped as they can and
 * adds nothing to the row's height.
 */
export function AirPlayButton(): React.ReactNode {
	return (
		<View style={styles.slot}>
			<View style={styles.iconBox}>
				<AirPlayButtonView style={styles.picker} tint={palette.primary} />
			</View>
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
	iconBox: {width: TAP_TARGET, height: ICON_BOX, alignItems: 'center', justifyContent: 'center'},
	picker: {
		position: 'absolute',
		width: TAP_TARGET,
		height: TAP_TARGET,
		top: (ICON_BOX - TAP_TARGET) / 2,
	},
	label: {fontSize: 13, textAlign: 'center'},
})
