// @flow

import * as React from 'react'
import {Heading, Text, Padding, SectionHeading} from './parts'
import {Column} from '../../../components/layout'

type Props = {
	directors: string,
	writers: string,
	actors: string,
}

export const Credits = ({directors, writers, actors}: Props) => {
	return (
		<React.Fragment>
			<SectionHeading>CREDITS</SectionHeading>
			<Padding marginTop={4}>
				{writers === directors ? (
					<Column marginBottom={16}>
						<Heading>Written and Directed By</Heading>
						<Text>{directors}</Text>
					</Column>
				) : (
					<React.Fragment>
						<Column marginBottom={16}>
							<Heading>Directed By</Heading>
							<Text>{directors}</Text>
						</Column>
						<Column marginBottom={16}>
							<Heading>Written By</Heading>
							<Text>{writers}</Text>
						</Column>
					</React.Fragment>
				)}

				<Column>
					<Heading>Cast</Heading>
					<Text>{actors}</Text>
				</Column>
			</Padding>
		</React.Fragment>
	)
}
