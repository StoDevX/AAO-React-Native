import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {SymbolView} from 'expo-symbols'
import {ScrubSlider} from '@frogpond/radio-scrub/slider'

import {djAudio, useScrubControlsAvailable, useScrubPlayback} from '../use-radio-scrub'
import {palette} from './palette'

/** Pitch and its separately accessible lock live in the DJ drawer. */
export function PitchControls({stationId}: {stationId: string}): React.ReactNode {
	let available = useScrubControlsAvailable(stationId)
	let pitch = useScrubPlayback((state) => (state.stationId === stationId ? state.pitch : null))
	let locked = useScrubPlayback((state) => state.stationId === stationId && state.quartzLocked)
	return (
		<View>
			<View style={styles.header}>
				<Text style={[styles.value, palette.styles.primary]}>
					Pitch {pitch === null ? '—' : `${pitch >= 0 ? '+' : ''}${pitch.toFixed(1)}%`}
				</Text>
				<Pressable
					accessibilityLabel="Quartz lock"
					accessibilityRole="button"
					accessibilityState={{selected: locked, disabled: !available}}
					disabled={!available}
					onPress={() => djAudio.quartz(stationId, !locked)}
					style={[styles.lock, locked && styles.selected, !available && styles.disabled]}
				>
					<SymbolView
						name={locked ? 'lock.fill' : 'lock.open'}
						size={16}
						tintColor={palette.primary}
					/>
					<Text style={[styles.label, palette.styles.primary]}>Quartz</Text>
				</Pressable>
			</View>
			<ScrubSlider
				label="Pitch"
				signed={true}
				minimum={-8}
				maximum={8}
				value={pitch ?? 0}
				disabled={!available}
				tint={palette.primary}
				style={styles.slider}
				onValueChange={(event) => djAudio.pitch(stationId, event.nativeEvent.value)}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	slider: {height: 44},
	label: {fontSize: 13},
	value: {fontSize: 14, fontVariant: ['tabular-nums']},
	lock: {
		minWidth: 80,
		minHeight: 44,
		paddingHorizontal: 12,
		flexDirection: 'row',
		gap: 6,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
	},
	selected: {backgroundColor: palette.track},
	disabled: {opacity: 0.4},
})
