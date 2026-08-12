import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/// `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
/// reaches expo-modules-core's native bindings, which do not exist in the test
/// runtime -- so a component that renders SwiftUI is untestable without a
/// stand-in. This one covers the three views CategoryPicker uses, and turns
/// the Picker's segments into pressables so the selection can be driven the
/// way a tap would drive it natively.
///
/// Deliberately narrow: it exports what this feature imports and nothing else,
/// rather than pretending to be the whole module.

type Modifier = {$type: string; [key: string]: unknown}

export const pickerStyle = (style: string): Modifier => ({
	$type: 'pickerStyle',
	style,
})

export const tag = (value: string | number): Modifier => ({
	$type: 'tag',
	tag: value,
})

export function Host({
	children,
}: {
	children?: React.ReactNode
}): React.ReactNode {
	return <View>{children}</View>
}

export function Text({
	children,
}: {
	children?: React.ReactNode
	modifiers?: Modifier[]
}): React.ReactNode {
	return <RNText>{children}</RNText>
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
