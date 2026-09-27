/** The two campuses that serve building hours through this feature. */
export type Campus = 'stolaf' | 'carleton'

/**
 * What a building's dot says: whether it is open, about to change, or shut for
 * chapel.
 */
export type BuildingStatusType = 'Open' | 'Almost Open' | 'Almost Closed' | 'Chapel' | 'Closed'

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

export type NamedBuildingScheduleType = {
	title: string
	notes?: string
	isPhysicallyOpen?: boolean
	closedForChapelTime?: boolean
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
	url: string
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
	/**
	 * What the venue is, where `category` is only how the Hours list groups it:
	 * a building's own hours, an office, a space inside a building, or a service
	 * with hours and no place (the SARN Hotline). A building's map card shows its
	 * `building` venue.
	 *
	 * Optional: Carleton's feed has no `kind`, and neither does St. Olaf's
	 * server feed, nor a cache persisted from it, until the server serves this
	 * data. The bundled data always carries it.
	 */
	kind?: 'building' | 'office' | 'space' | 'service'
	/** False keeps the venue out of the Hours list's categories; it is still
	 * found by search and listed on the All spaces screen. Absent means listed. */
	listed?: boolean
	links?: BuildingLinkType[]
	schedule: NamedBuildingScheduleType[]
	breakSchedule?: BreakScheduleContainerType
}
