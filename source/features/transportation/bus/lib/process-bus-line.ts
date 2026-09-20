import type {BusLine, BusSchedule, UnprocessedBusLine, UnprocessedBusSchedule} from '../types'
import {BusTimetableEntry} from '../types'

import {parseTime} from './parse-time'
import type {Moment} from 'moment'

export const processBusSchedule =
	(now: Moment, tz?: string) =>
	(scheduleData: UnprocessedBusSchedule): BusSchedule => {
		let times = scheduleData.times.map((timeList) => timeList.map(parseTime(now, tz)))

		let timetable = scheduleData.stops.map((stopName, i) => {
			// A hand-maintained line can omit coordinates entirely; render it
			// rather than throw.
			let coordinates = scheduleData.coordinates?.[stopName]
			let departures = times.map((timeList) => timeList[i])
			let stop: BusTimetableEntry = {name: stopName, departures, coordinates}
			return stop
		})

		return {
			days: scheduleData.days,
			// The input may omit coordinates; the output always carries a map,
			// possibly empty, so nothing downstream needs an optional check.
			coordinates: scheduleData.coordinates ?? {},
			stops: scheduleData.stops,
			times: times,
			timetable: timetable,
		}
	}

export function processBusLine(lineData: UnprocessedBusLine, now: Moment): BusLine {
	return {
		line: lineData.line,
		colors: lineData.colors,
		timezone: lineData.timezone,
		schedules: lineData.schedules.map(processBusSchedule(now, lineData.timezone)),
	}
}
