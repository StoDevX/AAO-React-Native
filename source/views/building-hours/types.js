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

export type BuildingScheduleEntry = {
	days: Array<DayOfWeekEnumType>,
	from: string,
	to: string,
}

export type BuildingSchedule = {
	title: 'Hours' | string,
	notes?: string,
	isPhysicallyOpen?: boolean,
	closedForChapelTime?: boolean,
	hours: Array<BuildingScheduleEntry>,
}

export type OverrideBuildingSchedule = {
	period: string | Date | {start: Date, end: Date},
	isNotice?: boolean,
	noticeMessage?: string,
	schedule: Array<BuildingSchedule>,
}

export type BuildingType = {
	name: string,
	subtitle?: string,
	abbreviation?: string,
	isNotice?: boolean,
	noticeMessage?: string,
	image?: string,
	category: string,
	schedule: Array<BuildingSchedule>,
	overrides?: Array<OverrideBuildingSchedule>,
}
