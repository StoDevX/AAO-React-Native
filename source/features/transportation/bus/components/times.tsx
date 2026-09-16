import * as React from 'react'

import {StyleProp, Text, TextStyle} from 'react-native'
import {formatTime} from '@frogpond/time-format'
import type {DepartureTimeList} from '../types'

type Props = {
	times: DepartureTimeList
	style?: StyleProp<TextStyle>
}

export function ScheduleTimes({times, style}: Props): React.ReactNode {
	return (
		<Text style={style}>
			{times
				// and format the times
				.map((time) => (time ? formatTime(time) : 'None'))
				.join(' • ')}
		</Text>
	)
}
