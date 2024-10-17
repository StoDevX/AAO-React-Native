import type {Moment} from 'moment'
import {ColorValue} from 'react-native'

export type DayOfWeek = 'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'
export type Coordinates = [number, number]

export interface BusLineColors {
	bar: ColorValue
	dot: ColorValue
}

export type UnprocessedDepartureTimeList = (string | false)[]
export type DepartureTimeList = (null | Moment)[]

export interface BusTimetableEntry {
	name: string
	coordinates?: Coordinates
	departures: DepartureTimeList
}

export interface UnprocessedBusLine {
	line: string
	colors: BusLineColors
	notice?: string
	schedules: UnprocessedBusSchedule[]
}

export interface BusLine {
	line: string
	colors: BusLineColors
	schedules: BusSchedule[]
}

export interface UnprocessedBusSchedule {
	days: DayOfWeek[]
	coordinates: Record<string, Coordinates>
	stops: string[]
	times: UnprocessedDepartureTimeList[]
}

export interface BusSchedule {
	days: DayOfWeek[]
	timetable: BusTimetableEntry[]
	stops: string[]
	coordinates: Record<string, Coordinates>
	times: DepartureTimeList[]
}
