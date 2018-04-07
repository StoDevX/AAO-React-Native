// @flow
import * as React from 'react'
import {Platform, TextInput, StyleSheet} from 'react-native'
import * as c from '../../components/colors'
import {AllHtmlEntities} from 'html-entities'

const entities = new AllHtmlEntities()

const styles = StyleSheet.create({
	text: {
		color: c.black,
		backgroundColor: c.white,
		paddingHorizontal: 15,
		paddingTop: 10,
		paddingBottom: 10,
		...Platform.select({
			ios: {
				fontWeight: '500',
			},
			android: {
				fontWeight: '600',
			},
		}),
	},
})

export const SelectableCell = ({text}: {text: string}) => (
	<TextInput
		dataDetectorTypes="all"
		editable={false}
		multiline={true}
		style={styles.text}
		value={entities.decode(text)}
	/>
)
