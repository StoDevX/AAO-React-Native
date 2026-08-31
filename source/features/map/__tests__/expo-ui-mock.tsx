import * as React from 'react'
import {Pressable, Text as RNText, TextInput, View} from 'react-native'

/// `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
/// reaches expo-modules-core's native bindings, which do not exist in the test
/// runtime -- so a component that renders SwiftUI is untestable without a
/// stand-in. This one covers the views the map sheets use, rendering each as
/// the React Native view closest to what it does natively: taps land on
/// pressables, text lands in <Text>, and a modifier that sets an accessibility
/// label sets one here too, so queries read the same as they would on device.
///
/// Deliberately narrow: it exports what this feature imports and nothing else,
/// rather than pretending to be the whole module.

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

export const pickerStyle = (style: string): Modifier => ({
	$type: 'pickerStyle',
	style,
})

export const tag = (value: string | number): Modifier => ({
	$type: 'tag',
	tag: value,
})

export const accessibilityLabel = (label: string): Modifier => ({
	$type: 'accessibilityLabel',
	label,
})

export const font = (params: Record<string, unknown>): Modifier => ({
	$type: 'font',
	...params,
})

export const foregroundStyle = (style: unknown): Modifier => ({
	$type: 'foregroundStyle',
	style,
})

export const autocorrectionDisabled = (disabled = true): Modifier => ({
	$type: 'autocorrectionDisabled',
	disabled,
})

export const listRowInsets = (params: Record<string, number> = {}): Modifier => ({
	$type: 'listRowInsets',
	...params,
})

export const contentShape = (shape: unknown): Modifier => ({
	$type: 'contentShape',
	shape,
})

export const shapes = {rectangle: (): Modifier => ({$type: 'rectangle'})}

export const buttonStyle = (style: string): Modifier => ({
	$type: 'buttonStyle',
	style,
})

/// The label a `accessibilityLabel(…)` modifier asks for, which is what
/// VoiceOver -- and therefore `getByLabelText` -- would report natively.
function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifiers?.find((m) => m.$type === 'accessibilityLabel')
	return typeof found?.label === 'string' ? found.label : undefined
}

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Text({children, modifiers}: WithModifiers): React.ReactNode {
	return <RNText accessibilityLabel={labelOf(modifiers)}>{children}</RNText>
}

export function List({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

List.ForEach = function ListForEach({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Section({children, title}: WithModifiers & {title?: string}): React.ReactNode {
	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{children}
		</View>
	)
}

export function HStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function VStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Spacer(): React.ReactNode {
	return <View />
}

export function RNHostView({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Image({
	modifiers,
	systemName,
}: WithModifiers & {systemName?: string; size?: number}): React.ReactNode {
	return <View accessibilityLabel={labelOf(modifiers) ?? systemName} />
}

export function Button({
	children,
	modifiers,
	onPress,
}: WithModifiers & {onPress?: () => void}): React.ReactNode {
	return (
		<Pressable accessibilityLabel={labelOf(modifiers)} onPress={onPress}>
			{children}
		</Pressable>
	)
}

export function TextField({
	modifiers,
	onTextChange,
	placeholder,
}: WithModifiers & {
	placeholder?: string
	onTextChange?: (text: string) => void
}): React.ReactNode {
	// A SwiftUI TextField reports its placeholder as its accessibility label
	// when it has no separate one, which is how the sheet's search field is
	// found both on device and here.
	return (
		<TextInput
			accessibilityLabel={labelOf(modifiers) ?? placeholder}
			onChangeText={onTextChange}
			placeholder={placeholder}
		/>
	)
}

type PickerProps<T> = {
	selection?: T
	onSelectionChange?: (selection: T) => void
	children?: React.ReactNode
	modifiers?: Modifier[]
}

/// Reads each child's `tag(…)` modifier, which is what the native picker
/// reports back through `onSelectionChange`.
function tagOf(child: React.ReactNode): unknown {
	if (!React.isValidElement<{modifiers?: Modifier[]}>(child)) {
		return undefined
	}
	return child.props.modifiers?.find((m) => m.$type === 'tag')?.tag
}

export function Picker<T>({
	selection,
	onSelectionChange,
	children,
}: PickerProps<T>): React.ReactNode {
	return (
		<View>
			{React.Children.map(children, (child) => {
				let value = tagOf(child) as T
				return (
					<Pressable
						accessibilityState={{selected: value === selection}}
						onPress={() => onSelectionChange?.(value)}
					>
						{child}
					</Pressable>
				)
			})}
		</View>
	)
}
export const menuIndicator = (visibility: string): Modifier => ({
	$type: 'menuIndicator',
	visibility,
})
