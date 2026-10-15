import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	BottomSheet,
	Button,
	Form,
	Group,
	Host,
	Picker,
	Section,
	Stepper,
	Text,
} from '@expo/ui/swift-ui'
import {
	pickerStyle,
	presentationDetents,
	presentationDragIndicator,
	tag,
} from '@expo/ui/swift-ui/modifiers'

import {useRadioStore} from '../store'
import {useRadioDevStore, type CaptionPresentation} from './store'

/** What each presentation is called in the picker. */
const PRESENTATIONS: ReadonlyArray<{value: CaptionPresentation; label: string}> = [
	{value: 'live', label: 'Live'},
	{value: 'hold-back', label: 'Hold back last words'},
	{value: 'two-tone', label: 'Dim last words'},
]

/** The delay stepper moves in these, in seconds. */
const DELAY_STEP_SECONDS = 0.5

/**
 * Settings for trying out the radio's captions on a phone, stacked over the Now
 * Playing sheet as the full schedule is. Reached from the station menu in dev mode.
 */
export function RadioDevSettingsSheet(): React.ReactNode {
	let open = useRadioStore((state) => state.devSettingsOpen)
	let closeDevSettings = useRadioStore((state) => state.closeDevSettings)
	let presentation = useRadioDevStore((state) => state.captionPresentation)
	let heldBackWords = useRadioDevStore((state) => state.heldBackWords)
	let delayMs = useRadioDevStore((state) => state.captionDelayMs)
	let setPresentation = useRadioDevStore((state) => state.setCaptionPresentation)
	let setHeldBackWords = useRadioDevStore((state) => state.setHeldBackWords)
	let setDelayMs = useRadioDevStore((state) => state.setCaptionDelayMs)
	let reset = useRadioDevStore((state) => state.reset)

	return (
		<Host pointerEvents="none" style={styles.host}>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={(presented) => {
					if (!presented) {
						closeDevSettings()
					}
				}}
			>
				<Group
					modifiers={[
						presentationDetents(['medium', 'large']),
						presentationDragIndicator('visible'),
					]}
				>
					<Form>
						<Section title="Radio Dev Settings">
							<Button label="Done" onPress={closeDevSettings} />
						</Section>
						<Section
							footer={
								<Text>How the line being spoken shows. Settled lines always show whole.</Text>
							}
							title="Captions"
						>
							<Picker
								label="Presentation"
								modifiers={[pickerStyle('menu')]}
								onSelectionChange={setPresentation}
								selection={presentation}
							>
								{PRESENTATIONS.map(({value, label}) => (
									<Text key={value} modifiers={[tag(value)]}>
										{label}
									</Text>
								))}
							</Picker>
							<Stepper
								label={`Held-back or dimmed words: ${heldBackWords}`}
								max={3}
								min={0}
								onValueChange={setHeldBackWords}
								step={1}
								value={heldBackWords}
							/>
							<Stepper
								label={`Display delay: ${(delayMs / 1000).toFixed(1)} s`}
								max={15}
								min={0}
								onValueChange={(seconds) => setDelayMs(seconds * 1000)}
								step={DELAY_STEP_SECONDS}
								value={delayMs / 1000}
							/>
						</Section>
						<Section>
							<Button label="Reset to defaults" onPress={reset} role="destructive" />
						</Section>
					</Form>
				</Group>
			</BottomSheet>
		</Host>
	)
}

const styles = StyleSheet.create({
	// Nothing to see or touch until the sheet is presented.
	host: {position: 'absolute', width: 0, height: 0},
})
