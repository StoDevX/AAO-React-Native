// @flow
import * as React from 'react'
import {Text, StyleSheet} from 'react-native'
import {Cell} from 'react-native-tableview-simple'

const styles = StyleSheet.create({
	cell: {
		paddingVertical: 10,
	},
})

export const SelectableCell = ({text}: {text: string}) => (
	<Cell
		cellContentView={
			<Text selectable={true} style={styles.cell}>
				{text}
			</Text>
		}
	/>
)
