import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/// `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
/// reaches expo-modules-core's native bindings, which do not exist in the test
/// runtime -- so a component that renders SwiftUI is untestable without a
/// stand-in. This one covers the views the event detail uses, rendering each as
/// the React Native view closest to what it does natively.
///
/// Deliberately narrow, matching the map feature's mock: it exports what this
/// module imports and nothing else, rather than pretending to be the whole
/// module.

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

const modifier =
	($type: string) =>
	(value?: unknown): Modifier => ({$type, value})

export const font = modifier('font')
export const foregroundColor = modifier('foregroundColor')
export const textSelection = modifier('textSelection')
export const frame = modifier('frame')
export const background = modifier('background')
export const multilineTextAlignment = modifier('multilineTextAlignment')
export const buttonStyle = modifier('buttonStyle')

export const accessibilityLabel = (label: string): Modifier => ({
	$type: 'accessibilityLabel',
	label,
})

/// The label an `accessibilityLabel(…)` modifier asks for, which is what
/// VoiceOver -- and therefore `getByLabelText` -- would report natively.
function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifiers?.find((m) => m.$type === 'accessibilityLabel')
	return typeof found?.label === 'string' ? found.label : undefined
}

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Form({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function VStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function HStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Text({
	children,
	modifiers,
	testID,
}: WithModifiers & {testID?: string}): React.ReactNode {
	return (
		<RNText accessibilityLabel={labelOf(modifiers)} testID={testID}>
			{children}
		</RNText>
	)
}

/// `title` renders as text so a test can assert a section is present, and
/// `footer` renders its slot content so the "Add to calendar" status message is
/// queryable.
export function Section({
	children,
	title,
	footer,
}: WithModifiers & {title?: string; footer?: React.ReactNode}): React.ReactNode {
	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{children}
			{footer}
		</View>
	)
}

export function Link({label, destination}: {label?: string; destination: string}): React.ReactNode {
	return <RNText accessibilityLabel={destination}>{label ?? destination}</RNText>
}

export function Button({
	children,
	onPress,
	modifiers,
}: WithModifiers & {onPress?: () => void; disabled?: boolean}): React.ReactNode {
	return (
		<Pressable accessibilityLabel={labelOf(modifiers)} onPress={onPress}>
			{children}
		</Pressable>
	)
}
