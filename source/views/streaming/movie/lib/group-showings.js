// @flow

import moment from 'moment-timezone'
import values from 'lodash/values'
import sortBy from 'lodash/sortBy'
import type {MovieShowing, GroupedShowing} from '../types'
const TIMEZONE = 'America/Winnipeg'

export function groupShowings(
	showings: Array<MovieShowing>,
): Array<GroupedShowing> {
	const grouped = showings.reduce((grouped, showing) => {
		const m = moment.tz(showing.time, TIMEZONE)

		const date = m.format('D')
		const month = m.format('MMM').toLowerCase()
		const location = showing.location

		const key = `${date}-${month}-${location}`

		const time =
			m.minutes() === 0
				? m.format('hA').toLowerCase()
				: m.format('h:mmA').toLowerCase()

		let grouping = {
			key,
			date,
			month,
			location,
			times: [],
		}

		if (!(key in grouped)) {
			grouped[key] = grouping
		}

		grouped[key].times.push(time)

		return grouped
	}, {})

	return sortBy(
		values(grouped),
		({date, month, times}) => `${String(date).padStart(2, '0')}-${month}-${times[0]}`,
	)
}
