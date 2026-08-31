import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

const modifier =
	($type: string) =>
	(value?: unknown): Modifier => ({$type, value})

export const accessibilityIdentifier = modifier('accessibilityIdentifier')
export const accessibilityLabel = modifier('accessibilityLabel')
export const aspectRatio = modifier('aspectRatio')
export const background = modifier('background')
export const buttonStyle = modifier('buttonStyle')
export const contentShape = modifier('contentShape')
export const font = modifier('font')
export const foregroundStyle = modifier('foregroundStyle')
export const frame = modifier('frame')
export const kerning = modifier('kerning')
export const lineLimit = modifier('lineLimit')
export const listRowInsets = modifier('listRowInsets')
export const listStyle = modifier('listStyle')
export const minimumScaleFactor = modifier('minimumScaleFactor')
export const monospacedDigit = modifier('monospacedDigit')
export const multilineTextAlignment = modifier('multilineTextAlignment')
export const padding = modifier('padding')
export const refreshable = modifier('refreshable')
export const resizable = modifier('resizable')
export const textSelection = modifier('textSelection')

export const shapes = {
	rectangle: () => ({type: 'rectangle'}) as const,
	circle: () => ({type: 'circle'}) as const,
}

function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifiers?.find((m) => m.$type === 'accessibilityLabel')
	return found?.value as string | undefined
}

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
export function VStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
export function HStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
export function Spacer(): React.ReactNode {
	return <View />
}
export function Text({children}: WithModifiers): React.ReactNode {
	return <RNText>{children}</RNText>
}
export function RNHostView({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
/**
 * `title` renders as text so a test can assert a section is present. `header`
 * and `footer` are real `SwiftUIContent` slots on the native component -- a
 * bare string handed to either crashes at mount -- but react-test-renderer
 * happily accepts a raw string child of `View`, so rendering it wouldn't catch
 * that. The throws below are what earn the claim.
 */
export function Section({
	title,
	header,
	footer,
	children,
}: WithModifiers & {
	title?: string
	header?: React.ReactNode
	footer?: React.ReactNode
}): React.ReactNode {
	if (typeof header === 'string') {
		throw new Error('Section header is a SwiftUI slot; a bare string crashes at mount')
	}

	if (typeof footer === 'string') {
		throw new Error('Section footer is a SwiftUI slot; a bare string crashes at mount')
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
export function List({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
/**
 * `children` must be nested elements, not a plain string: the throw below
 * mirrors that constraint instead of silently accepting what the real
 * component would reject.
 */
export function Button({
	children,
	modifiers,
	onPress,
}: WithModifiers & {onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	return (
		<Pressable accessibilityLabel={labelOf(modifiers)} onPress={onPress}>
			{children}
		</Pressable>
	)
}
/** `uiImage` is a local path; the mock only records that one was asked for. */
export function Image({
	uiImage,
	systemName,
}: {
	uiImage?: string
	systemName?: string
}): React.ReactNode {
	return <View testID={uiImage ? `icon-${uiImage}` : `symbol-${systemName}`} />
}
