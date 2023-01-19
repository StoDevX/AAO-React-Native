import React from 'react'
// import {HomeView} from '../views/home'
// import * as Calendar from '../views/calendar'
import {EventType} from '@frogpond/event-type'
import {FilterType} from '@frogpond/filter/types'
import {PoweredBy} from '@frogpond/event-list'
import {BuildingType} from '../views/building-hours/types'

import * as calendar from '../views/calendar'
import {ContactType} from '../views/contacts/types'
import {StudentOrgType} from '../views/student-orgs/types'
import {RouteParams as HoursEditorType} from '../views/building-hours/report/editor'
import {WordType} from '../views/dictionary/types'
import {UnprocessedBusLine} from '../views/transportation/bus/types'
import type {
	MasterCorIconMapType,
	MenuItemType as MenuItem,
} from '../views/menus/types'
import {Printer, PrintJob} from '../lib/stoprint/types'
import {JobType} from '../views/sis/student-work/types'
import {CourseType} from '../lib/course-search/types'
import {DirectoryItem, DirectorySearchTypeEnum} from '../views/directory/types'
import {ReportNavigationKey as BuildingHoursProblemReport} from '../views/building-hours/report'
import {NavigationKey as Debug} from '../views/settings/screens/debug'

export type RootViewsParamList = {
	Home: undefined
	BuildingHours: undefined
	[calendar.NavigationKey]: calendar.NavigationParams
	Contacts: undefined
	CourseSearch: undefined
	Dictionary: undefined
	Directory:
		| {queryType?: DirectorySearchTypeEnum; queryParam?: string}
		| undefined
	Faq: undefined
	Help: undefined
	Menus: undefined
	News: undefined
	SIS: undefined
	Streaming: undefined
	StudentOrgs: undefined
	Transportation: undefined
	PrintJobs: undefined
	More: undefined
}

export type CafeMenuParamList = {
	CarletonBurtonMenu: undefined
	CarletonLDCMenu: undefined
	CarletonWeitzMenu: undefined
	CarletonSaylesMenu: undefined
}

export type RadioScheduleParamList = {
	KSTOSchedule: undefined
	KRLXSchedule: undefined
}

export type MiscViewParamList = {
	HomeRoot: undefined
	Profile: {userId: string}
	Feed: {sort: 'latest' | 'top'} | undefined
	EventDetail: {event: EventType; poweredBy: PoweredBy}
	BuildingHoursDetail: {building: BuildingType}
	[BuildingHoursProblemReport]: {initialBuilding: BuildingType}
	BuildingHoursScheduleEditor: HoursEditorType
	ContactsDetail: {contact: ContactType}
	DictionaryDetail: {item: WordType}
	DictionaryEditor: {item: WordType}
	DirectoryDetail: {contact: DirectoryItem}
	Job: undefined
	JobDetail: {job: JobType}
	CourseSearchResults: {
		initialQuery?: string
		initialFilters?: FilterType<CourseType>[]
	}
	CourseDetail: {course: CourseType}
	StudentOrgsDetail: {org: StudentOrgType}
	BusMapView: {line: UnprocessedBusLine}
	MenuItemDetail: {item: MenuItem; icons: MasterCorIconMapType}
	PrinterList: {job: PrintJob}
	PrintJobRelease: {job: PrintJob; printer?: Printer}
}

export type RootStackParamList = RootViewsParamList &
	CafeMenuParamList &
	RadioScheduleParamList &
	MiscViewParamList

export type SettingsStackParamList = {
	APITest: undefined
	BonAppPicker: undefined
	Credits: undefined
	[Debug]: {keyPath: string[]}
	Faq: undefined
	IconSettings: undefined
	Legal: undefined
	Privacy: undefined
	Settings: undefined
	SettingsRoot: undefined
}

export interface ChangeTextEvent {
	nativeEvent: {text: React.SetStateAction<string>}
}

export interface OnChangeTextHandler {
	onChange: (event: ChangeTextEvent) => void
}

// this block sourced from https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace ReactNavigation {
		interface RootParamList
			extends RootStackParamList,
				SettingsStackParamList {}
	}
}
