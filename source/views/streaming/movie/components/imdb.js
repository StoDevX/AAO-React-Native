// @flow

import * as React from 'react'
import * as c from '../../../components/colors'
import openUrl from '../../../components/open-url'
import glamorous from 'glamorous-native'

const imdbUrl = id => `https://www.imdb.com/title/${id}`

export const ImdbLink = ({id}: {id: string}) => {
	if (!id) {
		return null
	}

	return (
		<glamorous.Text
			color={c.infoBlue}
			fontSize={17}
			marginLeft={16}
			onPress={() => openUrl(imdbUrl(id))}
			paddingVertical={14}
		>
			Open IMDB Page
		</glamorous.Text>
	)
}
