import React from 'react'

import {FilterType} from '@frogpond/filter/types'
import * as eventList from '@frogpond/event-list'

import * as menus from '../views/menus'
import * as calendar from '../views/calendar'
import * as news from '../views/news'
import * as sis from '../views/sis'
import * as streaming from '../views/streaming'
import * as transportation from '../views/transportation'
import * as debug from '../views/settings/screens/debug'
import * as buildingHours from '../views/building-hours'

import {BuildingType} from '../views/building-hours/types'
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

export type RootViewsParamList = {
	Home: undefined
	[calendar.NavigationKey]: calendar.NavigationParams
	[menus.NavigationKey]: undefined
	[news.NavigationKey]: undefined
	[sis.NavigationKey]: undefined
	[streaming.NavigationKey]: undefined
	[transportation.NavigationKey]: undefined
	BuildingHours: undefined
	Contacts: undefined
	CourseSearch: undefined
	Dictionary: undefined
	Directory:
		| {queryType?: DirectorySearchTypeEnum; queryParam?: string}
		| undefined
	Faq: undefined
	Help: undefined
	More: undefined
	PrintJobs: undefined
	StudentOrgs: undefined
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
	[eventList.EventDetail.NavigationKey]: eventList.EventDetail.ParamList
	BuildingHoursDetail: {building: BuildingType}
	[buildingHours.ReportNavigationKey]: {initialBuilding: BuildingType}
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
	[debug.NavigationKey]: {keyPath: string[]}
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
