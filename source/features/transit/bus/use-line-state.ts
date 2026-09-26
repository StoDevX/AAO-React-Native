import * as React from 'react'
import type {Moment} from 'moment-timezone'

import {deriveLineState, processBusLine} from './lib'
import type {UnprocessedBusLine} from './types'

/**
 * A line's state at a moment in time, with the feed parsed no more often than
 * the calendar makes it necessary.
 *
 * `processBusLine` runs a strict `moment` parse over every time in every one of
 * the line's schedules -- roughly 500 of them across the four lines the
 * Transit screen draws at once, some 15ms of work. The clock's only
 * contribution to that is the date each parsed time is stamped with, so the
 * key is the day rather than the moment and the minute's tick reuses the parse.
 */
export function useLineState({
	line,
	now,
}: {
	line: UnprocessedBusLine
	now: Moment
}): ReturnType<typeof deriveLineState> {
	let day = now.format('YYYY-MM-DD')

	let parsedLine = React.useMemo(
		() => processBusLine(line, now),
		// oxlint-disable-next-line react/exhaustive-deps -- `now` enters only through `day`, which is the point
		[line, day],
	)

	return deriveLineState({line: parsedLine, now})
}
