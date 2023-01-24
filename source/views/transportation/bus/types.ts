import type {Moment} from 'moment'

export type DayOfWeek = 'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'
export type Coordinates = [number, number]

export type BusLineColors = {
	bar: string
	dot: string
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
	schedules: Array<UnprocessedBusSchedule>
}

export type BusLine = {
	line: string
	colors: BusLineColors
	schedules: Array<BusSchedule>
}

export type UnprocessedBusSchedule = {
	days: Array<DayOfWeek>
	stops: Array<string>
	coordinates: {[name: string]: Coordinates}
	times: Array<UnprocessedDepartureTimeList>
}

export type BusSchedule = {
	days: Array<DayOfWeek>
	timetable: Array<BusTimetableEntry>
	stops: Array<string>
	coordinates: {[name: string]: Coordinates}
	times: Array<DepartureTimeList>
}
