import * as React from 'react'
import type {NativeSyntheticEvent} from 'react-native'
import {requireNativeView} from 'expo'

/// No `text` prop: the bar owns its text and reports changes. Cancel clears
/// it natively and reports the empty string before `onCancel`.
export type CampusSearchBarProps = {
	placeholder: string
	onTextChange: (text: string) => void
	onFocusChange: (focused: boolean) => void
	onCancel: () => void
	testID?: string
}

type NativeProps = {
	placeholder: string
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
