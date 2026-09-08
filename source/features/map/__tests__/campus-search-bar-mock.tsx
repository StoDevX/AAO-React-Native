import * as React from 'react'
import {Pressable, Text, TextInput, View} from 'react-native'

import type {CampusSearchBarProps} from '@frogpond/campus-search-bar'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so the picker's tests render this instead. A text
/// input for the field and a pressable for Cancel are enough to drive the
/// branches the picker decides in JavaScript.
///
/// Cancel renders unconditionally here, where the real bar hides it until the
/// field is focused or holds text -- so a Jest test is never evidence about
/// whether Cancel is visible, only about what happens when it is pressed.
/// Like the real bar, the input owns its text: nothing writes it from JS.
export function CampusSearchBar({
	onCancel,
	onFocusChange,
	onTextChange,
	placeholder,
	testID,
}: CampusSearchBarProps): React.ReactNode {
	return (
		<View>
			<TextInput
				accessibilityLabel={testID ?? placeholder}
				onBlur={() => onFocusChange(false)}
				onChangeText={onTextChange}
				onFocus={() => onFocusChange(true)}
				placeholder={placeholder}
			/>
			<Pressable accessibilityRole="button" onPress={onCancel}>
				<Text>Cancel</Text>
			</Pressable>
		</View>
	)
}
