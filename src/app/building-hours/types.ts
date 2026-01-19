export type BuildingStatusType =
	| 'Open'
	| 'Closed'
	| 'Almost Closed'
	| 'Almost Open'
	| 'Chapel'

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

export type BreakScheduleContainerType = Record<
	BreakNameEnumType,
	NamedBuildingScheduleType[]
>

export type BuildingLinkType = {
	title: string
	url: URL
}

export type BuildingType = {
	name: string
	subtitle?: string
	abbreviation?: string
	isNotice?: boolean
	noticeMessage?: string
	image?: string
	category: string
	links?: BuildingLinkType[]
	schedule: NamedBuildingScheduleType[]
	breakSchedule?: BreakScheduleContainerType
}
