const TIME_FORMAT = 'h:mma'
import {timezone} from '@frogpond/constants'
import type {Temporal} from 'temporal-polyfill'
import {parseTimeToday} from '../../../../lib/temporal'

type MaybeTime = string | false

const parseTime =
	(now: Temporal.ZonedDateTime) =>
	(time: MaybeTime): null | Temporal.ZonedDateTime => {
		if (time === false) {
			return null
		}

		return parseTimeToday(time, timezone(), now)
	}

export {parseTime}
void TIME_FORMAT
