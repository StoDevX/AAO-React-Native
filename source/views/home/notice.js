// @flow

import * as React from 'react'
import * as glamorous from 'glamorous-native'
import * as c from '../components/colors'
import sample from 'lodash/sample'

const messages = [
	'☃️ An Unofficial App Project ☃️',
	'Unofficially made by students, for students',
	'SGA-owned and misunderstood',
	'I AM AN UNOFFICIAL APP',
	'we are (not) olaf',
	'☃️',
]

export function UnofficialAppNotice() {
	return (
		<glamorous.View marginHorizontal={10} justifyContent="center">
			<glamorous.View backgroundColor="rgba(0,0,0,0.05)" borderRadius={7}>
				<glamorous.Text color={c.black25Percent} textAlign="center" padding={8}>
					{sample(messages)}
				</glamorous.Text>
			</glamorous.View>
		</glamorous.View>
	)
}
