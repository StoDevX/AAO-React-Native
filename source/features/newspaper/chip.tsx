import * as React from 'react'
import {Button, HStack, Image, Text} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	controlSize,
	font,
	foregroundStyle,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import type {SFSymbol} from 'sf-symbols-typescript'
import {faded, ink, messRed, onMessRed} from './palette'

const ON_LABEL = [font({textStyle: 'subheadline', weight: 'semibold'}), foregroundStyle(onMessRed)]
const OFF_LABEL = [font({textStyle: 'subheadline', weight: 'semibold'}), foregroundStyle(ink)]

type Props = {
	label: string
	/** A glyph drawn before the label, in the label's colour */
	systemImage?: SFSymbol
	/** The chip's name for a UI test; chips of one row share it and are told apart by label */
	identifier: string
	/** Whether this is the chosen chip of its row */
	isOn?: boolean
	onPress: () => void
}

/**
 * A capsule chip, its label led by an optional glyph, filled in the Mess red and marked selected
 * when it is the chosen one. A large control is at least 44 points tall.
 */
export function Chip({
	label,
	systemImage,
	identifier,
	isOn = false,
	onPress,
}: Props): React.ReactNode {
	return (
		<Button
			// The same modifiers in the same order either way, so a chip changes its look rather
			// than being rebuilt.
			modifiers={[
				buttonStyle(isOn ? 'borderedProminent' : 'bordered'),
				buttonBorderShape('capsule'),
				controlSize('large'),
				tint(isOn ? messRed : faded),
				accessibilityLabel(label),
				accessibilityIdentifier(identifier),
				accessibilityAddTraits(isOn ? ['isSelected'] : []),
			]}
			onPress={onPress}
		>
			<HStack spacing={6}>
				{systemImage ? (
					<Image modifiers={isOn ? ON_LABEL : OFF_LABEL} systemName={systemImage} />
				) : null}
				<Text modifiers={isOn ? ON_LABEL : OFF_LABEL}>{label}</Text>
			</HStack>
		</Button>
	)
}
