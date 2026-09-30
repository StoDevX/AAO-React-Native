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
	// The field's own text, as the native bar holds it: focus events report
	// whether it is empty at that moment, not what JavaScript last saw.
	let text = React.useRef('')
	// Cancel resigns the field, which reports a focus change only when the
	// field had focus to give up.
	let focused = React.useRef(false)
	return (
		<View>
			<TextInput
				accessibilityLabel={testID ?? placeholder}
				onBlur={() => {
					focused.current = false
					onFocusChange(false, text.current !== '')
				}}
				onChangeText={(value) => {
					text.current = value
					onTextChange(value)
				}}
				onFocus={() => {
					focused.current = true
					onFocusChange(true, text.current !== '')
				}}
				placeholder={placeholder}
			/>
			{/* Cancel clears the field before it resigns, so the end-editing
			    event reports no text; the empty text and the cancel follow. */}
			<Pressable
				accessibilityRole="button"
				onPress={() => {
					text.current = ''
					if (focused.current) {
						focused.current = false
						onFocusChange(false, false)
					}
					onTextChange('')
					onCancel()
				}}
			>
				<Text>Cancel</Text>
			</Pressable>
		</View>
	)
}
