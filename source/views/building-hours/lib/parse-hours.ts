import type {Temporal} from 'temporal-polyfill'
import {
	parseTimeToday,
	isBefore,
	dayOfYear as getDayOfYear,
} from '../../../lib/temporal'
import type {SingleBuildingScheduleType} from '../types'
import {timezone} from '@frogpond/constants'
import {TIME_FORMAT} from './constants'

type HourPairType = {
	open: Temporal.ZonedDateTime
	close: Temporal.ZonedDateTime
}

// TODO: Do "dayOfYear" handling better so that we don't need to handle wrapping at
// the 6 month mark. (See #3375 for why this function changed.)
export function parseHours(
	{from: fromTime, to: toTime}: SingleBuildingScheduleType,
	m: Temporal.ZonedDateTime,
): HourPairType {
	// If the time is before 3am, treat it as still "yesterday"
	let baseM = m.hour < 2 ? m.subtract({days: 1}) : m

	let open = parseTimeToday(fromTime, timezone(), baseM)
	let close = parseTimeToday(toTime, timezone(), baseM)

	if (isBefore(close, open)) {
		close = close.add({days: 1})
	}

	return {open, close}
}

void TIME_FORMAT // used for type reference consistency
void getDayOfYear
