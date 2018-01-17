// @flow

import type {
	UnprocessedBusLine,
	BusLine,
	UnprocessedBusSchedule,
	BusSchedule,
} from '../types'

import {parseTime} from './parse-time'
import type moment from 'moment'

export const processBusSchedule = (now: moment) => (
	scheduleData: UnprocessedBusSchedule,
): BusSchedule => {
	const times = scheduleData.times.map(timeList => timeList.map(parseTime(now)))

	const timetable = scheduleData.stops.map((stopName, i) => {
		let stop = {}
		stop.name = stopName

		if (stopName in scheduleData.coordinates) {
			stop.coordinates = scheduleData.coordinates[stopName]
		}

		stop.departures = times.map(timeList => timeList[i])

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
	now: moment,
): BusLine {
	return {
		line: lineData.line,
		colors: lineData.colors,
		schedules: lineData.schedules.map(processBusSchedule(now)),
	}
}
