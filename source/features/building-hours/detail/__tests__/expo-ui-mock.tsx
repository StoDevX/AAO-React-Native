import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/**
 * `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
 * reaches expo-modules-core's native bindings, which do not exist in the test
 * runtime -- so a component that renders SwiftUI is untestable without a
 * stand-in. This one covers the views the building hours detail uses,
 * rendering each as the React Native view closest to what it does natively.
 *
 * Deliberately narrow, matching the event-list and map features' mocks: it
 * exports what this module imports and nothing else, rather than pretending
 * to be the whole module.
 */

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

const modifier =
	($type: string) =>
	(value?: unknown): Modifier => ({$type, value})

export const font = modifier('font')
export const foregroundStyle = modifier('foregroundStyle')
export const frame = modifier('frame')
export const clipShape = modifier('clipShape')
export const padding = modifier('padding')
export const background = modifier('background')
export const buttonStyle = modifier('buttonStyle')
export const listStyle = modifier('listStyle')

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function List({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function VStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function HStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Spacer(): React.ReactNode {
	return null
}

export function Text({children}: WithModifiers): React.ReactNode {
	return <RNText>{children}</RNText>
}

/**
 * `title` renders as text so a test can assert a section is present.
 * `header`/`footer` are real `SwiftUIContent` slots on the native component --
 * a bare string handed to either crashes at mount -- but react-test-renderer
 * happily accepts a raw string child of `View`, so rendering them wouldn't
 * catch that. The explicit throw below is what earns the claim.
 */
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

/**
 * `ButtonProps` documents that children must be nested elements, not plain
 * strings; the throw below mirrors that constraint instead of silently
 * accepting what the real component would reject.
 */
export function Button({
	children,
	onPress,
}: WithModifiers & {onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	return <Pressable onPress={onPress}>{children}</Pressable>
}
