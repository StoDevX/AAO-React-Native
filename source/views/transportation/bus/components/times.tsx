import * as React from 'react'
import {StyleProp, Text, TextStyle} from 'react-native'

import type {DepartureTimeList} from '../types'

const TIME_FORMAT = 'h:mma'

type Props = {
	times: DepartureTimeList
	style: StyleProp<TextStyle>
}

export function ScheduleTimes({times, style}: Props): JSX.Element {
	return (
		<Text style={style}>
			{times
				// and format the times
				.map((time) => time?.format(TIME_FORMAT) ?? 'None')
				.join(' • ')}
		</Text>
	)
}
