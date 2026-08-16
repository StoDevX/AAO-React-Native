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
export const disabled = modifier('disabled')

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

/// Whether a `disabled(…)` modifier is present and true, matching SwiftUI's
/// `.disabled()` -- there is no `disabled` prop on the real `Button`.
function disabledOf(modifiers?: Modifier[]): boolean {
	let found = modifiers?.find((m) => m.$type === 'disabled')
	if (!found) return false
	return found.value !== false
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

/// `title` renders as text so a test can assert a section is present.
/// `header`/`footer` are real `SwiftUIContent` slots on the native component --
/// a bare string handed to either crashes at mount -- but react-test-renderer
/// happily accepts a raw string child of `View`, so rendering them wouldn't
/// catch that. The explicit throw below is what earns the claim.
export function Section({
	children,
	title,
	header,
	footer,
}: WithModifiers & {
	title?: string
	header?: React.ReactNode
	footer?: React.ReactNode
}): React.ReactNode {
	if (typeof header === 'string' || typeof footer === 'string') {
		throw new Error('Section header/footer are SwiftUI slots; a bare string crashes at mount')
	}

	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{header}
			{children}
			{footer}
		</View>
	)
}

export function Link({label, destination}: {label?: string; destination: string}): React.ReactNode {
	return <RNText accessibilityLabel={destination}>{label ?? destination}</RNText>
}

/// `ButtonProps` documents that children must be nested elements, not plain
/// strings; the throw below mirrors that constraint instead of silently
/// accepting what the real component would reject.
export function Button({
	children,
	label,
	onPress,
	modifiers,
}: WithModifiers & {label?: string; onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	return (
		<Pressable
			accessibilityLabel={labelOf(modifiers)}
			disabled={disabledOf(modifiers)}
			onPress={onPress}
		>
			{children ?? (label ? <RNText>{label}</RNText> : null)}
		</Pressable>
	)
}
