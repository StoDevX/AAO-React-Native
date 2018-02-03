// @flow

import * as React from 'react'
import {Pill} from './pill'

export const Genres = ({genres}: {genres: string}) => {
	return genres
		.toLowerCase()
		.split(', ')
		.map(genre => (
			<Pill key={genre} bgColorName="mediumGray" marginRight={4}>
				{genre}
			</Pill>
		))
}
