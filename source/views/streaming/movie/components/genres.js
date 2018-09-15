// @flow

import * as React from 'react'
import {Pill} from './pill'
import * as c from '@frogpond/colors'

export const Genres = ({genres}: {genres: Array<string>}) => {
	return genres.map(genre => (
		<Pill key={genre} bgColor={c.candyGray} marginRight={4}>
			{genre.toLowerCase()}
		</Pill>
	))
}
