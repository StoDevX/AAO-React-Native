import * as React from 'react'
import {View} from 'react-native'

/// `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
/// reaches expo-modules-core's native bindings, which do not exist in the
/// test runtime -- so anything that imports tile.tsx needs a stand-in even
/// when the test never renders a tile. `columnsForFontScale` is a pure
/// function that never touches these exports, so the stand-ins only need to
/// exist, not behave.
///
/// Deliberately narrow, matching source/features/map/__tests__/expo-ui-mock.tsx
/// and its siblings: this exports what tile.tsx imports and nothing else.

type Modifier = {$type: string; [key: string]: unknown}
type WithChildren = {children?: React.ReactNode}

export function Button({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

export function ContextMenu({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}
ContextMenu.Trigger = function ContextMenuTrigger({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}
ContextMenu.Items = function ContextMenuItems({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

export function Image(): React.ReactNode {
	return <View />
}

export function RoundedRectangle(): React.ReactNode {
	return <View />
}

export function Text({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

export function VStack({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

export function ZStack({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

export const accessibilityLabel = (label: string): Modifier => ({
	$type: 'accessibilityLabel',
	label,
})

export const aspectRatio = (params: Record<string, unknown>): Modifier => ({
	$type: 'aspectRatio',
	...params,
})

export const buttonStyle = (style: string): Modifier => ({$type: 'buttonStyle', style})

export const contentShape = (shape: unknown, kind?: string): Modifier => ({
	$type: 'contentShape',
	shape,
	kind,
})

export const font = (params: Record<string, unknown>): Modifier => ({$type: 'font', ...params})

export const foregroundStyle = (style: unknown): Modifier => ({$type: 'foregroundStyle', style})

export const frame = (params: Record<string, unknown>): Modifier => ({$type: 'frame', ...params})

export const lineLimit = (limit: number): Modifier => ({$type: 'lineLimit', limit})

export const multilineTextAlignment = (alignment: string): Modifier => ({
	$type: 'multilineTextAlignment',
	alignment,
})

export const shapes = {
	rectangle: (): Modifier => ({$type: 'rectangle'}),
	roundedRectangle: (params: Record<string, unknown>): Modifier => ({
		$type: 'roundedRectangle',
		...params,
	}),
}
