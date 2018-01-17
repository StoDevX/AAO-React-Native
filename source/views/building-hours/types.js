// @flow

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
	days: DayOfWeekEnumType[],
	from: string,
	to: string,
}

export type NamedBuildingScheduleType = {
	title: 'Hours' | string,
	notes?: string,
	isPhysicallyOpen?: boolean,
	closedForChapelTime?: boolean,
	hours: SingleBuildingScheduleType[],
}

export type BreakScheduleContainerType = {
	[key: BreakNameEnumType]: NamedBuildingScheduleType[],
}

export type BuildingType = {
	name: string,
	subtitle?: string,
	abbreviation?: string,
	isNotice?: boolean,
	noticeMessage?: string,
	image?: string,
	category: string,
	schedule: NamedBuildingScheduleType[],
	breakSchedule?: BreakScheduleContainerType,
}
