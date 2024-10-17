import * as React from 'react'
import {TextInput, StyleSheet} from 'react-native'
import * as c from '../../colors'

const styles = StyleSheet.create({
	text: {
		color: c.secondaryLabel,
		backgroundColor: c.systemBackground,
		paddingHorizontal: 15,
		paddingTop: 10,
		paddingBottom: 10,
	},
})

export const SelectableCell = ({text}: {text: string}): React.JSX.Element => (
	<TextInput
		dataDetectorTypes="all"
		editable={false}
		multiline={true}
		scrollEnabled={false}
		style={styles.text}
		value={text}
	/>
)
