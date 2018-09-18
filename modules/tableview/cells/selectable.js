// @flow
import * as React from 'react'
import {TextInput, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	text: {
		color: c.black,
		backgroundColor: c.white,
		paddingHorizontal: 15,
		paddingTop: 10,
		paddingBottom: 10,
	},
})

export const SelectableCell = ({text}: {text: string}) => (
	// $FlowExpectedError Cannot create TextInput element because property scrollEnabled is missing in object type [1] but exists in props [2].
	<TextInput
		dataDetectorTypes="all"
		editable={false}
		multiline={true}
		scrollEnabled={false}
		style={styles.text}
		value={text}
	/>
)
