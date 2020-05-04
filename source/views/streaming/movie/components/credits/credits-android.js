// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Card, Subheading, Paragraph} from 'react-native-paper'

type Props = {
	directors: string,
	writers: string,
	actors: string,
}

export const AndroidCredits = ({directors, writers, actors}: Props) => {
	return (
		<>
			{writers === directors ? (
				<Card style={styles.card}>
					<Card.Title title="Credits" />
					<Card.Content style={styles.content}>
						<Subheading>Written and Directed By</Subheading>
						<Paragraph>{directors}</Paragraph>
					</Card.Content>

					<Card.Content style={styles.content}>
						<Subheading>Cast</Subheading>
						<Paragraph>{actors}</Paragraph>
					</Card.Content>
				</Card>
			) : (
				<>
					<Card style={styles.card}>
						<Card.Title title="Credits" />
						<Card.Content style={styles.content}>
							<Subheading>Directed By</Subheading>
							<Paragraph>{directors}</Paragraph>
						</Card.Content>

						<Card.Content style={styles.content}>
							<Subheading>Written By</Subheading>
							<Paragraph>{writers}</Paragraph>
						</Card.Content>

						<Card.Content style={styles.content}>
							<Subheading>Cast</Subheading>
							<Paragraph>{actors}</Paragraph>
						</Card.Content>
					</Card>
				</>
			)}
		</>
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
