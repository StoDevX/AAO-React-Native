// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Card, Paragraph} from 'react-native-paper'

type Props = {
	directors: string,
	writers: string,
	actors: string,
}

export const AndroidCredits = ({directors, writers, actors}: Props) => {
	return (
		<>
			{writers === directors ? (
				<Card style={styles.androidCard}>
					<Card.Title title="Written and Directed By" />
					<Card.Content>
						<Paragraph>{directors}</Paragraph>
					</Card.Content>
				</Card>
			) : (
				<>
					<Card style={styles.androidCard}>
						<Card.Title title="Directed By" />
						<Card.Content>
							<Paragraph>{directors}</Paragraph>
						</Card.Content>
					</Card>

					<Card style={styles.androidCard}>
						<Card.Title title="Written By" />
						<Card.Content>
							<Paragraph>{writers}</Paragraph>
						</Card.Content>
					</Card>
				</>
			)}

			<Card style={styles.androidCard}>
				<Card.Title title="Cast" />
				<Card.Content>
					<Paragraph>{actors}</Paragraph>
				</Card.Content>
			</Card>
		</>
	)
}

const styles = StyleSheet.create({
	androidCard: {
		marginHorizontal: 10,
		marginBottom: 10,
	},
})
