// @flow

import * as React from 'react'
import * as glamorous from 'glamorous-native'
import * as c from '../components/colors'
import sample from 'lodash/sample'

const messages = [
	'☃️ An Unofficial App Project ☃️',
	'For students, by students',
	'By students, for students',
	'An unofficial St. Olaf app',
	'For Oles, by Oles',
	'☃️',
	'🦁',
]

export function UnofficialAppNotice() {
	return (
		<glamorous.View justifyContent="center" marginHorizontal={10}>
			<glamorous.View backgroundColor="rgba(0,0,0,0.05)" borderRadius={7}>
				<glamorous.Text color={c.black25Percent} padding={8} textAlign="center">
					{sample(messages)}
				</glamorous.Text>
			</glamorous.View>
		</glamorous.View>
	)
}
