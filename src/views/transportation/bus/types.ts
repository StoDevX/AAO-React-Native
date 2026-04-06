import type {Moment} from 'moment'
import {ColorValue} from 'react-native'

export type DayOfWeek = 'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'
export type Coordinates = [number, number]

export type BusLineColors = {
	bar: ColorValue
	dot: ColorValue
}

export type UnprocessedDepartureTimeList = (string | false)[]
export type DepartureTimeList = (null | Moment)[]

export type BusTimetableEntry = {
	name: string
	coordinates?: Coordinates
	departures: DepartureTimeList
}

export type UnprocessedBusLine = {
	line: string
	colors: BusLineColors
	notice?: string
	schedules: UnprocessedBusSchedule[]
}

export type BusLine = {
	line: string
	colors: BusLineColors
	schedules: BusSchedule[]
}

export type UnprocessedBusSchedule = {
	days: DayOfWeek[]
	coordinates: Record<string, Coordinates>
	stops: string[]
	times: UnprocessedDepartureTimeList[]
}

export type BusSchedule = {
	days: DayOfWeek[]
	timetable: BusTimetableEntry[]
	stops: string[]
	coordinates: {[name: string]: Coordinates}
	times: DepartureTimeList[]
}
