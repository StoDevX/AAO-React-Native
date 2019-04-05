// @flow

import * as React from 'react'
import {Card, Paragraph} from 'react-native-paper'
import {StyleSheet} from 'react-native'

export const AndroidPlot = ({text}: {text: string}) => {
	return (
		<Card style={styles.card}>
			<Card.Title title="Plot" />
			<Card.Content style={styles.content}>
				<Paragraph>{text}</Paragraph>
			</Card.Content>
		</Card>
	)
}

const styles = StyleSheet.create({
	card: {
		elevation: 2,
		marginBottom: 10,
		marginHorizontal: 10,
	},

	content: {
		marginBottom: 12,
	},
})
