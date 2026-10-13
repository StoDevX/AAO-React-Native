import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import type {AudioEffect, EffectParameter, ReverbPreset} from '@frogpond/radio-scrub'
import {ScrubSlider} from '@frogpond/radio-scrub/slider'

import {djAudio, useScrubControlsAvailable, useScrubPlayback} from '../use-radio-scrub'
import {palette} from './palette'
import {PitchControls} from './pitch-controls'

const EFFECTS: {id: AudioEffect; label: string}[] = [
	{id: 'echo', label: 'Echo'},
	{id: 'filter', label: 'Filter'},
	{id: 'reverb', label: 'Reverb'},
]
const PRESETS: {id: ReverbPreset; label: string}[] = [
	{id: 0, label: 'Small room'},
	{id: 1, label: 'Medium hall'},
	{id: 2, label: 'Large hall'},
	{id: 3, label: 'Boe Chapel'},
	{id: 4, label: 'Skinner Chapel'},
	{id: 5, label: 'Kelsey Theater'},
	{id: 6, label: 'Urness Recital Hall'},
	{id: 7, label: 'Kracum Hall'},
	{id: 8, label: 'Skoglund'},
]

const ROOM_PROFILES: Partial<
	Record<
		ReverbPreset,
		{
			decay: readonly [number, number]
			choices?: readonly [string, string]
			controlLabel?: string
		}
	>
> = {
	3: {decay: [3, 2], choices: ['Empty', 'Full audience'], controlLabel: 'Audience'},
	4: {decay: [2.25, 1.5], choices: ['Empty', 'Full audience'], controlLabel: 'Audience'},
	5: {decay: [1, 1]},
	6: {decay: [1.75, 1.75]},
	7: {decay: [2, 1.3], choices: ['Curtains stowed', 'Curtains out'], controlLabel: 'Acoustics'},
	8: {decay: [2.5, 1.5], choices: ['Plain gym', 'Christmas Festival'], controlLabel: 'Setup'},
}

/** Each effect expands into its own controls, starting from dry audio when enabled. */
export function AudioScrubControls({stationId}: {stationId: string}): React.ReactNode {
	let available = useScrubControlsAvailable(stationId)
	let customRoomsAvailable = useScrubPlayback(
		(state) => state.stationId === stationId && state.customRoomsAvailable,
	)
	let effects = useScrubPlayback((state) => (state.stationId === stationId ? state.effects : null))
	let delayed = useScrubPlayback(
		(state) => state.stationId === stationId && state.delaySeconds >= 0.25,
	)
	return (
		<View style={styles.controls}>
			<View style={styles.header}>
				<Text style={[styles.heading, palette.styles.primary]}>DJ Mode</Text>
				{delayed ? (
					<Pressable
						accessibilityLabel="Go Live"
						accessibilityRole="button"
						onPress={() => djAudio.live(stationId)}
						style={styles.live}
					>
						<Text style={[styles.buttonText, palette.styles.primary]}>Go Live</Text>
					</Pressable>
				) : null}
			</View>
			{!available ? <Text style={palette.styles.secondary}>Play to use DJ controls.</Text> : null}
			<PitchControls stationId={stationId} />
			{EFFECTS.map(({id, label}) => {
				let setting = effects?.[id]
				let enabled = setting?.enabled ?? false
				let parameter = (name: EffectParameter, value: number) =>
					djAudio.parameter(stationId, id, name, value)
				return (
					<View key={id} style={styles.effect}>
						<Pressable
							accessibilityLabel={label}
							accessibilityRole="button"
							accessibilityState={{selected: enabled, disabled: !available, expanded: enabled}}
							disabled={!available}
							onPress={() => djAudio.effect(stationId, id, !enabled, 0)}
							style={[
								styles.effectButton,
								enabled && styles.selected,
								!available && styles.disabled,
							]}
						>
							<Text style={[styles.buttonText, palette.styles.primary]}>
								{label}
								{enabled ? ' ✓' : ' ＋'}
							</Text>
						</Pressable>
						{enabled && setting ? (
							<View style={styles.parameters}>
								{id === 'filter' ? (
									<>
										<EffectSlider
											label="Low-cut · removes bass"
											spokenLabel="Filter low-cut amount"
											value={setting.lowCut * 100}
											maximum={100}
											display={
												setting.lowCut === 0
													? 'Off'
													: `${Math.round(20 * (4000 / 20) ** setting.lowCut)} Hz`
											}
											disabled={!available}
											onChange={(value) => parameter('lowCut', value / 100)}
										/>
										<EffectSlider
											label="High-cut · removes treble"
											spokenLabel="Filter high-cut amount"
											value={setting.highCut * 100}
											maximum={100}
											display={
												setting.highCut === 0
													? 'Off'
													: `${Math.round(20000 * (250 / 20000) ** setting.highCut)} Hz`
											}
											disabled={!available}
											onChange={(value) => parameter('highCut', value / 100)}
										/>
									</>
								) : (
									<EffectSlider
										label="Mix"
										spokenLabel={`${label} mix`}
										value={setting.amount * 100}
										maximum={100}
										display={`${Math.round(setting.amount * 100)}%`}
										disabled={!available}
										onChange={(value) => djAudio.effect(stationId, id, true, value / 100)}
									/>
								)}
								{id === 'echo' ? (
									<>
										<EffectSlider
											unit="milliseconds"
											label="Delay"
											spokenLabel="Echo delay in milliseconds"
											value={setting.delayMs}
											minimum={50}
											maximum={1000}
											display={`${Math.round(setting.delayMs)} ms`}
											disabled={!available}
											onChange={(value) => parameter('delayMs', value)}
										/>
										<EffectSlider
											label="Feedback"
											spokenLabel="Echo feedback"
											value={setting.feedback}
											maximum={75}
											display={`${Math.round(setting.feedback)}%`}
											disabled={!available}
											onChange={(value) => parameter('feedback', value)}
										/>
									</>
								) : null}
								{id === 'filter' ? (
									<EffectSlider
										label="Resonance"
										spokenLabel="Filter resonance"
										value={setting.resonance}
										maximum={100}
										display={`${Math.round(setting.resonance)}%`}
										disabled={!available}
										onChange={(value) => parameter('resonance', value)}
									/>
								) : null}
								{id === 'reverb' ? (
									<View>
										<Text style={palette.styles.secondary}>Room</Text>
										<View style={styles.presets}>
											{PRESETS.filter((preset) => preset.id < 3 || customRoomsAvailable).map(
												(preset) => (
													<Pressable
														key={preset.id}
														accessibilityLabel={`Reverb ${preset.label}`}
														accessibilityRole="button"
														accessibilityState={{
															selected: setting.preset === preset.id,
															disabled: !available,
														}}
														disabled={!available}
														onPress={() => parameter('preset', preset.id)}
														style={[styles.preset, setting.preset === preset.id && styles.selected]}
													>
														<Text style={palette.styles.primary}>{preset.label}</Text>
													</Pressable>
												),
											)}
										</View>
										<RoomProfile
											preset={setting.preset}
											occupancy={setting.occupancy}
											disabled={!available}
											onChange={(value) => parameter('occupancy', value)}
										/>
									</View>
								) : null}
							</View>
						) : null}
					</View>
				)
			})}
		</View>
	)
}

/** Venue setups adjust absorption while retaining the room’s reflection spacing. */
function RoomProfile({
	preset,
	occupancy,
	disabled,
	onChange,
}: {
	preset: ReverbPreset
	occupancy: number
	disabled: boolean
	onChange: (value: number) => void
}): React.ReactNode {
	let profile = ROOM_PROFILES[preset]
	if (!profile) return null
	let decay = profile.decay[0] + (profile.decay[1] - profile.decay[0]) * occupancy
	return (
		<View style={styles.roomProfile}>
			{profile.choices ? (
				<>
					<Text style={palette.styles.secondary}>{profile.controlLabel}</Text>
					<View style={styles.presets}>
						{profile.choices.map((label, value) => (
							<Pressable
								key={label}
								accessibilityLabel={`${PRESETS.find((room) => room.id === preset)?.label}, ${label}`}
								accessibilityRole="button"
								accessibilityState={{selected: occupancy === value, disabled}}
								disabled={disabled}
								onPress={() => onChange(value)}
								style={[styles.preset, occupancy === value && styles.selected]}
							>
								<Text style={palette.styles.primary}>{label}</Text>
							</Pressable>
						))}
					</View>
				</>
			) : null}
			<Text style={palette.styles.secondary}>Approximation · ~{decay.toFixed(1)} s decay</Text>
		</View>
	)
}

/** A labeled parameter uses the same native tracking as pitch and effect amounts. */
function EffectSlider({
	label,
	spokenLabel,
	value,
	minimum = 0,
	maximum,
	display,
	disabled,
	onChange,
	unit = 'percent',
}: {
	unit?: 'percent' | 'milliseconds'
	label: string
	spokenLabel: string
	value: number
	minimum?: number
	maximum: number
	display: string
	disabled: boolean
	onChange: (value: number) => void
}): React.ReactNode {
	return (
		<View>
			<Text style={palette.styles.secondary}>
				{label} {display}
			</Text>
			<ScrubSlider
				unit={unit}
				label={spokenLabel}
				minimum={minimum}
				maximum={maximum}
				value={value}
				disabled={disabled}
				tint={palette.primary}
				style={styles.slider}
				onValueChange={(event) => onChange(event.nativeEvent.value)}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	controls: {gap: 8},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 44,
	},
	heading: {fontSize: 14, fontWeight: '600'},
	live: {minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
	slider: {height: 44},
	effect: {gap: 8},
	roomProfile: {gap: 8},
	parameters: {paddingHorizontal: 12, gap: 8},
	effectButton: {
		minHeight: 44,
		paddingHorizontal: 12,
		paddingVertical: 8,
		justifyContent: 'center',
		borderRadius: 12,
		backgroundColor: palette.track,
	},
	presets: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
	preset: {
		minHeight: 44,
		paddingHorizontal: 12,
		justifyContent: 'center',
		borderRadius: 12,
		backgroundColor: palette.track,
	},
	selected: {borderWidth: 1, borderColor: palette.primary},
	buttonText: {fontSize: 15, fontWeight: '600'},
	disabled: {opacity: 0.4},
})
