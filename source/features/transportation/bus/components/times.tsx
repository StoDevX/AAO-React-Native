import * as React from 'react'

import {StyleProp, Text, TextStyle} from 'react-native'
import {formatTime} from '@frogpond/time-format'
import type {Moment} from 'moment-timezone'
import type {DepartureTimeList} from '../types'

type Props = {
	times: DepartureTimeList
	style?: StyleProp<TextStyle>
}

/**
 * A strict-mode parse of malformed feed data returns an Invalid Moment, not
 * `null` -- still truthy, so `time && ...` alone would not catch it, and
 * `Intl`-based formatting throws on an Invalid Date where moment's own
 * `.format()` never did.
 */
export function formatDeparture(time: Moment | null): string {
	return time && time.isValid() ? formatTime(time) : 'None'
}

export function ScheduleTimes({times, style}: Props): React.ReactNode {
	return <Text style={style}>{times.map(formatDeparture).join(' • ')}</Text>
}
