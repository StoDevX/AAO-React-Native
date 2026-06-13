import type {Moment} from 'moment-timezone'
import type {UnprocessedBusLine} from '../../transportation/bus/types'
import {processBusLine, getScheduleForNow} from '../../transportation/bus/lib'

export type NextDeparture = {
	line: string
	stopName: string | null
	time: Moment | null
}

export function selectNextDepartures(
	lines: UnprocessedBusLine[],
	now: Moment,
): NextDeparture[] {
	return lines.map((line) => {
		let processed = processBusLine(line, now)
		let schedule = getScheduleForNow(processed.schedules, now)
		let firstStop = schedule.timetable[0] ?? null
		let next =
			firstStop?.departures.find((t) => t != null && t.isSameOrAfter(now)) ??
			null

		return {
			line: line.line,
			stopName: firstStop?.name ?? null,
			time: next ?? null,
		}
	})
}
