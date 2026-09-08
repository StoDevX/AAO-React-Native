import * as React from 'react'
import type {NativeSyntheticEvent} from 'react-native'
import {requireNativeView} from 'expo'

export type CampusSearchBarProps = {
	placeholder: string
	text: string
	onTextChange: (text: string) => void
	onFocusChange: (focused: boolean) => void
	onCancel: () => void
	testID?: string
}

type NativeProps = {
	placeholder: string
	text: string
	testID?: string
	onTextChange: (event: NativeSyntheticEvent<{value: string}>) => void
	onFocusChange: (event: NativeSyntheticEvent<{value: boolean}>) => void
	onCancel: () => void
}

const CampusSearchBarNativeView: React.ComponentType<NativeProps> = requireNativeView(
	'CampusSearchBar',
	'CampusSearchBarView',
)

/// UIKit's search bar as SwiftUI content, for sheets built with `@expo/ui`.
/// Renders only inside a `Host`: it is a SwiftUI view, not a React Native one.
export function CampusSearchBar({
	onTextChange,
	onFocusChange,
	onCancel,
	...rest
}: CampusSearchBarProps): React.ReactNode {
	return (
		<CampusSearchBarNativeView
			{...rest}
			onCancel={onCancel}
			onFocusChange={(event) => onFocusChange(event.nativeEvent.value)}
			onTextChange={(event) => onTextChange(event.nativeEvent.value)}
		/>
	)
}
