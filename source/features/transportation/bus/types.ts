import type {Moment} from 'moment'
import {ColorValue} from 'react-native'

export type DayOfWeek = 'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'
export type Coordinates = [number, number]

export type BusLineColors = {
	bar: ColorValue
	dot: ColorValue
}

export type UnprocessedDepartureTimeList = Array<string | false>
export type DepartureTimeList = Array<null | Moment>

export type BusTimetableEntry = {
	name: string
	coordinates?: Coordinates
	departures: DepartureTimeList
}

export type UnprocessedBusLine = {
	line: string
	colors: BusLineColors
	notice?: string
	/**
	 * True when the line should not appear on the Transportation screen.
	 * The line stays in the feed for older app versions, which have no idea
	 * about this field and render the line as before; a newer version reads
	 * it and leaves the line off the screen.
	 */
	hidden?: boolean
	schedules: Array<UnprocessedBusSchedule>
}

export type BusLine = {
	line: string
	colors: BusLineColors
	schedules: Array<BusSchedule>
}

export type UnprocessedBusSchedule = {
	days: Array<DayOfWeek>
	coordinates: Record<string, Coordinates>
	stops: string[]
	times: Array<UnprocessedDepartureTimeList>
}

export type BusSchedule = {
	days: Array<DayOfWeek>
	timetable: Array<BusTimetableEntry>
	stops: Array<string>
	coordinates: {[name: string]: Coordinates}
	times: Array<DepartureTimeList>
}
