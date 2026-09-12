/**
 * What a building's dot says: whether it is open, about to change, shut for
 * chapel, or reachable by something that is not a door.
 */
export type BuildingStatusType =
	| 'Open'
	| 'Almost Open'
	| 'Almost Closed'
	| 'Chapel'
	| 'Service'
	| 'Closed'

export type DayOfWeekEnumType = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su'

export type BreakNameEnumType =
	| 'fall'
	| 'thanksgiving'
	| 'christmasfest'
	| 'winter'
	| 'interim'
	| 'spring'
	| 'easter'
	| 'summer'

export type SingleBuildingScheduleType = {
	days: DayOfWeekEnumType[]
	from: string
	to: string
}

/**
 * What a set that is not a door calls itself.
 *
 * `name` is what the status line says and is required: without a word for the
 * service there is no honest way to word the row, so the set stays closed. The
 * symbol is decoration, and falls back to a filled circle. `name` is short
 * because the row is narrow.
 */
export type ServiceStatusType = {
	symbol?: string
	name: string
}

export type NamedBuildingScheduleType = {
	title: string
	notes?: string
	isPhysicallyOpen?: boolean
	closedForChapelTime?: boolean
	status?: ServiceStatusType
	hours: SingleBuildingScheduleType[]
}

/**
 * Break schedules, keyed by break.
 *
 * Partial because neither campus publishes every break: both servers send seven
 * of the eight, omitting `christmasfest`. Requiring the full set made the type
 * a claim about the data that was never true.
 */
export type BreakScheduleContainerType = Partial<
	Record<BreakNameEnumType, NamedBuildingScheduleType[]>
>

export type BuildingLinkType = {
	title: string
	url: URL
}

export type BuildingType = {
	name: string
	subtitle?: string
	abbreviation?: string
	/** The map feature id this venue sits in, e.g. `toh` for Tomson Hall. Several
	 * venues can share one id — Registrar and Financial Aid both live in Tomson
	 * Hall. Carleton venues carry none; their hours live outside this repo. */
	building?: string
	isNotice?: boolean
	noticeMessage?: string
	image?: string
	category: string
	links?: BuildingLinkType[]
	schedule: NamedBuildingScheduleType[]
	breakSchedule?: BreakScheduleContainerType
}
