// @flow

import * as React from 'react'
import {Card, Paragraph} from 'react-native-paper'
import {StyleSheet} from 'react-native'

export const AndroidPlot = ({text}: {text: string}) => {
	return (
		<Card style={styles.androidCard}>
			<Card.Title title="Plot" />
			<Card.Content>
				<Paragraph>{text}</Paragraph>
			</Card.Content>
		</Card>
	)
}

const styles = StyleSheet.create({
	androidCard: {
		marginHorizontal: 10,
		marginBottom: 10,
	},
})
