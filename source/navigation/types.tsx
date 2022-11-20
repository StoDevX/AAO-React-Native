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

export type RootStackParamList = {
	Home: undefined
	HomeRoot: undefined
	Profile: {userId: string}
	Feed: {sort: 'latest' | 'top'} | undefined
	EventDetail: {event: EventType; poweredBy: PoweredBy}
	BuildingHoursDetail: {building: BuildingType}
	BuildingHours: undefined
	BuildingHoursProblemReport: {initialBuilding: BuildingType}
	BuildingHoursScheduleEditor: HoursEditorType
	[calendar.NavigationKey]: calendar.NavigationParams
	Contacts: undefined
	ContactsDetail: {contact: ContactType}
	CourseSearch: undefined
	DictionaryDetail: {item: WordType}
	Dictionary: undefined
	DictionaryEditor: {item: WordType}
	Directory: {queryType?: DirectorySearchTypeEnum; queryParam?: string}
	DirectoryDetail: {contact: DirectoryItem}
	Faq: undefined
	Help: undefined
	Job: undefined
	JobDetail: {job: JobType}
	Menus: undefined
	News: undefined
	SIS: undefined
	CourseSearchResults: {initialQuery?: string; initialFilters?: FilterType[]}
	CourseDetail: {course: CourseType}
	Streaming: undefined
	KSTOSchedule: undefined
	KRLXSchedule: undefined
	StudentOrgsDetail: {org: StudentOrgType}
	StudentOrgs: undefined
	Transportation: undefined
	BusMapView: {line: UnprocessedBusLine}
	CarletonBurtonMenu: undefined
	CarletonLDCMenu: undefined
	CarletonWeitzMenu: undefined
	CarletonSaylesMenu: undefined
	MenuItemDetail: {item: MenuItem; icons: MasterCorIconMapType}
	PrintJobs: undefined
	PrinterList: {job: PrintJob}
	PrintJobRelease: {job: PrintJob; printer?: Printer}
	More: undefined
}

export type SettingsStackParamList = {
	APITest: undefined
	BonAppPicker: undefined
	Credits: undefined
	Debug: undefined
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
