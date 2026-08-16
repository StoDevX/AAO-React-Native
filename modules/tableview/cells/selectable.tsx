import * as React from 'react'
import {TextInput, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	text: {
		color: c.secondaryLabel,
		backgroundColor: c.systemBackground,
		paddingHorizontal: 15,
		paddingTop: 10,
		paddingBottom: 10,
	},
})

/**
 * `dataDetectorTypes="all"` detects nothing under the new architecture:
 * `UIDataDetectorTypeAll` is `NSUIntegerMax`, and React Native reads it through
 * `unsignedIntValue`, truncating it to 32 bits. Naming the types works around
 * that, so they are spelled out rather than asked for collectively.
 *
 * See https://github.com/facebook/react-native/issues/55367.
 */
const DETECTED_TYPES: React.ComponentProps<typeof TextInput>['dataDetectorTypes'] = [
	'calendarEvent',
	'link',
	'phoneNumber',
	'address',
]

export const SelectableCell = ({text}: {text: string}): React.ReactNode => (
	<TextInput
		dataDetectorTypes={DETECTED_TYPES}
		editable={false}
		multiline={true}
		scrollEnabled={false}
		style={styles.text}
		value={text}
	/>
)
