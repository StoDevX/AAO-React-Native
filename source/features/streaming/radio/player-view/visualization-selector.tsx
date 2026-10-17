import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import type {VisualizationMode} from '@frogpond/radio-scrub/visualizer'
import {palette} from './palette'

/** The choice belongs to the DJ session; neither option changes playback. */
export function VisualizationSelector({
	mode,
	onChange,
}: {
	mode: VisualizationMode
	onChange: (mode: VisualizationMode) => void
}): React.ReactNode {
	return (
		<View style={styles.selector}>
			{(['waveform', 'spectrum'] as const).map((value) => (
				<Pressable
					key={value}
					accessibilityRole="button"
					accessibilityLabel={value === 'waveform' ? 'Waveform' : 'Spectrum'}
					accessibilityState={{selected: mode === value}}
					onPress={() => onChange(value)}
					style={[styles.option, mode === value && styles.selected]}
				>
					<Text style={palette.styles.primary}>
						{value === 'waveform' ? 'Waveform' : 'Spectrum'}
					</Text>
				</Pressable>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	selector: {flexDirection: 'row', borderRadius: 10, backgroundColor: palette.track, padding: 3},
	option: {flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8},
	selected: {backgroundColor: palette.track},
})
