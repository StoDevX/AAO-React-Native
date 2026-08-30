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
export const buttonStyle = modifier('buttonStyle')
export const contentShape = modifier('contentShape')
export const font = modifier('font')
export const foregroundStyle = modifier('foregroundStyle')
export const frame = modifier('frame')
export const listStyle = modifier('listStyle')
export const padding = modifier('padding')
export const refreshable = modifier('refreshable')
export const resizable = modifier('resizable')

export const shapes = {rectangle: () => ({type: 'rectangle'}) as const}

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
export function Section({
	header,
	children,
}: WithModifiers & {header?: React.ReactNode}): React.ReactNode {
	return (
		<View>
			{header}
			{children}
		</View>
	)
}
export function List({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
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
