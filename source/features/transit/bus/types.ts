import type {Moment} from 'moment'
import {ColorValue} from 'react-native'

export type DayOfWeek = 'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'
export type Coordinates = [number, number]

export type BusLineColors = {
	/// The line's own colour: the rail, every stop's dot, and the bus glyph on
	/// its widget header. Named for the progress bar it was first drawn on.
	bar: ColorValue
	/// The highlight for the one stop the bus is sitting at, darkened so it
	/// reads against `bar` beneath it. Despite the name, the other dots are
	/// `bar` -- this is the you-are-here marker, not the colour of a dot.
	dot: ColorValue
}

export type UnprocessedDepartureTimeList = Array<string | false>
export type DepartureTimeList = Array<null | Moment>

export type BusTimetableEntry = {
	name: string
	coordinates?: Coordinates
	departures: DepartureTimeList
}

/** A date a schedule's service does not run, generated from the feed's
 * `calendar_dates.txt` REMOVED rows. */
export type BusClosure = {
	/** `YYYY-MM-DD`, matching the data schema's `date` format. */
	date: string
	/** The holiday's name, e.g. "Labor Day" -- carried through from the
	 * feed's `holiday_name`, a Trillium extension to core GTFS. */
	name: string
}

export type UnprocessedBusLine = {
	line: string
	colors: BusLineColors
	notice?: string
	/**
	 * True when the line should not appear on the Transit screen.
	 * The line stays in the feed for older app versions, which have no idea
	 * about this field and render the line as before; a newer version reads
	 * it and leaves the line off the screen.
	 */
	hidden?: boolean
	schedules: Array<UnprocessedBusSchedule>
	/** The zone this line's wall-clock departure times are read in. Absent for
	 * hand-maintained lines, which fall back to the app-wide timezone. */
	timezone?: string
}

export type BusLine = {
	line: string
	colors: BusLineColors
	schedules: Array<BusSchedule>
	/** The zone this line's wall-clock departure times are read in. Absent for
	 * hand-maintained lines, which fall back to the app-wide timezone. */
	timezone?: string
}

export type UnprocessedBusSchedule = {
	days: Array<DayOfWeek>
	/** Absent for a hand-maintained line -- the schema has always allowed
	 * a schedule to omit this. */
	coordinates?: Record<string, Coordinates>
	stops: string[]
	times: Array<UnprocessedDepartureTimeList>
	/** Absent for a schedule whose service has no closures -- the schema has
	 * always allowed a schedule to omit this. */
	closures?: Array<BusClosure>
}

export type BusSchedule = {
	days: Array<DayOfWeek>
	timetable: Array<BusTimetableEntry>
	stops: Array<string>
	coordinates: {[name: string]: Coordinates}
	times: Array<DepartureTimeList>
	closures?: Array<BusClosure>
}
