// @flow

export type BuildingStatusType =
	| 'Open'
	| 'Closed'
	| 'Almost Closed'
	| 'Almost Open'
	| 'Chapel'

export type DayOfWeekEnumType = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su'

export type BreakCollection = {
	[key: string]: BreakOutlineSchedule,
}

export type BreakOutlineSchedule = {
	description: string,
	hasMealPlan?: boolean,
	limitedAccess?: boolean,
	start: string,
	end: string,
}

export type BuildingScheduleEntry = {
	closed?: boolean,
	days: Array<DayOfWeekEnumType>,
	from: string,
	to: string,
}

export type BuildingSchedule = {
	title: 'Hours' | string,
	notes?: string,
	closed?: boolean,
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
