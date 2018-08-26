// @flow
import * as React from 'react'
import {TextInput, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {htmlEntities} from '@frogpond/html-lib'

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
	<TextInput
		dataDetectorTypes="all"
		editable={false}
		multiline={true}
		style={styles.text}
		value={htmlEntities.decode(text)}
	/>
)
