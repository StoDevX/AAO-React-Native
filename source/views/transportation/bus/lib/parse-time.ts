import {timezone} from '@frogpond/constants'

import type {Moment} from 'moment-timezone'
import moment from 'moment-timezone'
const TIME_FORMAT = 'h:mma'

type MaybeTime = string | false

const parseTime =
	(now: Moment) =>
	(time: MaybeTime): null | Moment => {
		// either pass `false` through or return a parsed time
		if (time === false) {
			return null
		}

		// interpret in Central time
		let m = moment.tz(time, TIME_FORMAT, true, timezone())

		// and set the date to today
		m.year(now.year()).month(now.month()).date(now.date())

		return m
	}

export {parseTime}
