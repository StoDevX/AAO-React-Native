import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	content: {
		backgroundColor: c.secondarySystemGroupedBackground,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderTopColor: c.separator,
		borderBottomColor: c.separator,
		marginBottom: 10,
	},
	title: {
		color: c.label,
		fontSize: 16,
		fontWeight: 'bold',
		paddingTop: 15,
		paddingHorizontal: 15,
	},
	message: {
		color: c.secondaryLabel,
		fontSize: 14,
		paddingTop: 5,
		paddingBottom: 15,
		paddingHorizontal: 15,
	},
})

type Props = {
	message: string
	title: string
}

export function InfoHeader(props: Props): JSX.Element {
	return (
		<View style={styles.content}>
			<Text style={styles.title}>{props.title}</Text>
			<Text style={styles.message}>{props.message}</Text>
		</View>
	)
}
