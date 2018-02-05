// @flow

import * as React from 'react'
import {Pill} from './pill'

export const Genres = ({genres}: {genres: Array<string>}) => {
	return genres.map(genre => (
			<Pill key={genre} bgColorName="mediumGray" marginRight={4}>
				{genre.toLowerCase()}
			</Pill>
		))
}
