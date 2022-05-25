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
import {OtherModeType} from '../views/transportation/types'
import {UnprocessedBusLine} from '../views/transportation/bus/types'
import type {
	MasterCorIconMapType,
	MenuItemType as MenuItem,
} from '../views/menus/types'
import {Printer, PrintJob} from '../lib/stoprint/types'
import {JobType} from '../views/sis/student-work/types'
import {CourseType} from '../lib/course-search/types'

export type RootStackParamList = {
	Home: undefined
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
	Credits: undefined
	Debug: undefined
	APITest: undefined
	DictionaryDetail: {item: WordType}
	Dictionary: undefined
	DictionaryEditor: {item: WordType}
	Faq: undefined
	Help: undefined
	Job: undefined
	JobDetail: {job: JobType}
	Legal: undefined
	Menus: undefined
	BonAppPicker: undefined
	News: undefined
	Privacy: undefined
	Settings: undefined
	IconSettings: undefined
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
	OtherModesDetail: {mode: OtherModeType}
	CarletonBurtonMenu: undefined
	CarletonLDCMenu: undefined
	CarletonWeitzMenu: undefined
	CarletonSaylesMenu: undefined
	MenuItemDetail: {item: MenuItem; icons: MasterCorIconMapType}
	PrintJobs: undefined
	PrinterList: {job: PrintJob}
	PrintJobRelease: {job: PrintJob; printer?: Printer}
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
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		interface RootParamList extends RootStackParamList {}
	}
}
