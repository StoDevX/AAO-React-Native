import type {
	BusLine,
	BusSchedule,
	UnprocessedBusLine,
	UnprocessedBusSchedule,
} from '../types'
import {BusTimetableEntry} from '../types'

import {parseTime} from './parse-time'
import type {Moment} from 'moment'

export const processBusSchedule =
	(now: Moment) =>
	(scheduleData: UnprocessedBusSchedule): BusSchedule => {
		let times = scheduleData.times.map((timeList) =>
			timeList.map(parseTime(now)),
		)

		let timetable = scheduleData.stops.map((stopName, i) => {
			let coordinates = scheduleData.coordinates[stopName]
			let departures = times.map((timeList) => timeList[i] ?? null)
			let stop: BusTimetableEntry = {name: stopName, departures, coordinates}
			return stop
		})

		return {
			days: scheduleData.days,
			coordinates: scheduleData.coordinates,
			stops: scheduleData.stops,
			times: times,
			timetable: timetable,
		}
	}

export function processBusLine(
	lineData: UnprocessedBusLine,
	now: Moment,
): BusLine {
	return {
		line: lineData.line,
		colors: lineData.colors,
		schedules: lineData.schedules.map(processBusSchedule(now)),
	}
}
