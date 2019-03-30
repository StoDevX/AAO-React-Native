// @flow

import * as React from 'react'
import {Pill} from './pill'
import * as c from '@frogpond/colors'
import glamorous from 'glamorous-native'

export function Genres({genres}: {genres: Array<string>}) {
	return (
		<glamorous.ScrollView horizontal={true} overflow="hidden">
			{genres.map(genre => (
				<Pill key={genre} bgColor={c.candyGray} marginRight={4}>
					{genre.toLowerCase()}
				</Pill>
			))}
		</glamorous.ScrollView>
	)
}
