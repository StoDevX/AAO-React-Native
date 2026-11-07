import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {
	Button,
	GlassEffectContainer,
	Host,
	HStack,
	Picker,
	Section,
	Spacer,
	Text as SwiftUIText,
	Toggle,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityLabel,
	buttonStyle,
	controlSize,
	disabled as disabledModifier,
	foregroundStyle,
	frame,
	labelsHidden,
	padding,
	pickerStyle,
	tag,
	tint,
	toggleStyle,
} from '@expo/ui/swift-ui/modifiers'
import tinycolor from 'tinycolor2'
import type {AudioEffect, EffectParameter, ReverbPreset} from '@frogpond/radio-scrub'
import {ScrubSlider} from '@frogpond/radio-scrub/slider'
import type {VisualizationMode} from '@frogpond/radio-scrub/visualizer'

import {FILL_WIDTH} from '../../../../components/tile-layout'
import {djAudio, useScrubControlsAvailable, useScrubPlayback} from '../use-radio-scrub'
import {palette} from './palette'
import {PitchControls} from './pitch-controls'
import {VisualizationSelector} from './visualization-selector'

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
	8: {decay: [2.5, 1.5], choices: ['Plain gym', 'Xmas fest'], controlLabel: 'Setup'},
}

/** Each effect expands into its own controls, starting from dry audio when enabled. */
export function AudioScrubControls({
	stationId,
	tintColor,
	visualizationMode,
	onVisualizationModeChange,
}: {
	stationId: string
	tintColor: string
	visualizationMode?: VisualizationMode
	onVisualizationModeChange?: (mode: VisualizationMode) => void
}): React.ReactNode {
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
			{visualizationMode && onVisualizationModeChange ? (
				<VisualizationSelector mode={visualizationMode} onChange={onVisualizationModeChange} />
			) : null}
			<PitchControls stationId={stationId} />
			{EFFECTS.map(({id, label}) => {
				let setting = effects?.[id]
				let enabled = setting?.enabled ?? false
				let parameter = (name: EffectParameter, value: number) =>
					djAudio.parameter(stationId, id, name, value)
				return (
					<View key={id} style={styles.effect}>
						<Host
							matchContents={{vertical: true}}
							ignoreSafeArea="all"
							colorScheme="dark"
							style={styles.nativeHost}
						>
							<Toggle
								label={label}
								isOn={enabled}
								onIsOnChange={(active) => djAudio.effect(stationId, id, active, 0)}
								modifiers={[
									toggleStyle('switch'),
									foregroundStyle(palette.primary),
									disabledModifier(!available),
									frame({minHeight: 44}),
									accessibilityLabel(label),
								]}
							/>
						</Host>
						{enabled && setting ? (
							<View style={styles.parameters}>
								{id === 'filter' ? (
									<>
										<EffectSlider
											label="Low-cut (bass)"
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
											label="High-cut (treble)"
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
										<Host
											matchContents={{vertical: true}}
											colorScheme="dark"
											style={styles.nativeHost}
										>
											<HStack
												modifiers={[foregroundStyle(palette.primary), frame({minHeight: 44})]}
											>
												<SwiftUIText>Room</SwiftUIText>
												<Spacer />
												<Picker<ReverbPreset>
													label="Reverb room"
													selection={setting.preset}
													onSelectionChange={(value) => parameter('preset', value)}
													modifiers={[
														pickerStyle('menu'),
														labelsHidden(),
														tint(palette.primary),
														disabledModifier(!available),
														frame({minHeight: 44}),
														accessibilityLabel('Reverb room'),
													]}
												>
													<Section title="Standard">
														{PRESETS.filter((preset) => preset.id < 3).map((preset) => (
															<SwiftUIText key={preset.id} modifiers={[tag(preset.id)]}>
																{preset.label}
															</SwiftUIText>
														))}
													</Section>
													{customRoomsAvailable ? (
														<Section title="Campus spaces">
															{PRESETS.filter((preset) => preset.id >= 3).map((preset) => (
																<SwiftUIText key={preset.id} modifiers={[tag(preset.id)]}>
																	{preset.label}
																</SwiftUIText>
															))}
														</Section>
													) : null}
												</Picker>
											</HStack>
										</Host>
										<RoomProfile
											tintColor={tintColor}
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
	tintColor,
	preset,
	occupancy,
	disabled,
	onChange,
}: {
	tintColor: string
	preset: ReverbPreset
	occupancy: number
	disabled: boolean
	onChange: (value: number) => void
}): React.ReactNode {
	let profile = ROOM_PROFILES[preset]
	if (!profile) return null
	let decay = profile.decay[0] + (profile.decay[1] - profile.decay[0]) * occupancy
	let selectedTint = tinycolor(tintColor).lighten(4).toHexString()
	return (
		<View style={styles.roomProfile}>
			{profile.choices ? (
				<Host
					matchContents={{vertical: true}}
					colorScheme="dark"
					seedColor={tintColor}
					style={styles.nativeHost}
				>
					<VStack alignment="leading" spacing={12}>
						<SwiftUIText modifiers={[foregroundStyle(palette.secondary)]}>
							{profile.controlLabel}
						</SwiftUIText>
						<GlassEffectContainer spacing={8}>
							<HStack spacing={8} modifiers={[padding({vertical: 4})]}>
								{profile.choices.map((label, value) => {
									let selected = occupancy === value
									return (
										<Button
											key={label}
											onPress={() => onChange(value)}
											modifiers={[
												buttonStyle(selected ? 'glassProminent' : 'glass'),
												tint(selected ? selectedTint : tintColor),
												controlSize('large'),
												disabledModifier(disabled),
												accessibilityLabel(
													`${PRESETS.find((room) => room.id === preset)?.label}, ${label}`,
												),
												...(selected ? [accessibilityAddTraits(['isSelected'])] : []),
											]}
										>
											<SwiftUIText
												modifiers={[
													foregroundStyle(palette.primary),
													frame({maxWidth: FILL_WIDTH}),
												]}
											>
												{label}
											</SwiftUIText>
										</Button>
									)
								})}
							</HStack>
						</GlassEffectContainer>
					</VStack>
				</Host>
			) : null}
			<Text style={[styles.footnote, palette.styles.secondary]}>
				Approximation · ~{decay.toFixed(1)} s decay
			</Text>
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
			<View style={styles.sliderHeader}>
				<Text style={[styles.parameterLabel, palette.styles.primary]}>{label}</Text>
				<Text style={[styles.parameterValue, palette.styles.secondary]}>{display}</Text>
			</View>
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
	effect: {
		gap: 8,
		paddingVertical: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: palette.track,
	},
	nativeHost: {alignSelf: 'stretch'},
	roomProfile: {gap: 8},
	parameters: {gap: 8, paddingBottom: 8},
	sliderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		gap: 12,
	},
	parameterLabel: {fontSize: 15, flexShrink: 1},
	parameterValue: {fontSize: 14, fontVariant: ['tabular-nums']},
	footnote: {fontSize: 13},
	buttonText: {fontSize: 15, fontWeight: '600'},
})
