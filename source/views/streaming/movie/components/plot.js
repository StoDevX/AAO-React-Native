// @flow

import * as React from 'react'
import {Padding, Text} from './parts'

export const Plot = ({text, ...props}: {text: string}) => {
	return (
		<Padding marginTop={4} {...props}>
			<Text>{text}</Text>
		</Padding>
	)
}
