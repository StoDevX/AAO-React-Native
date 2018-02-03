// @flow

import * as React from 'react'
import {PaddedCard, Heading, Text} from './parts'
import {Column} from '../../../components/layout'

type Props = {directors: string, writers: string, actors: string}

export const Credits = ({directors, writers, actors}: Props) => {
	return (
		<PaddedCard>
			<WritersDirectors directors={directors} writers={writers} />

			<Column>
				<Heading>Cast</Heading>
				<Text>{actors}</Text>
			</Column>
		</PaddedCard>
	)
}

const WritersDirectors = ({writers, directors}) => {
	if (writers === directors) {
		return (
			<React.Fragment>
				<Column marginBottom={16}>
					<Heading>Written and Directed By</Heading>
					<Text>{directors}</Text>
				</Column>
			</React.Fragment>
		)
	}

	return (
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
	)
}
