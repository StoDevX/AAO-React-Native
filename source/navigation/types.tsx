import React from 'react'

import {FilterType} from '@frogpond/filter/types'
import * as eventList from '@frogpond/event-list'

import * as calendar from '../views/calendar'
import * as reddit from '../views/reddit'
import * as sis from '../views/sis'
import * as debug from '../views/settings/screens/debug'
import * as buildingHours from '../views/building-hours'
import * as settings from '../views/settings'

import {BuildingType} from '../views/building-hours/types'
import {ContactType} from '../views/contacts/types'
import {StudentOrgType} from '../views/student-orgs/types'
import {RouteParams as HoursEditorType} from '../views/building-hours/report/editor'
import {WordType} from '../views/dictionary/types'
import {
	UnprocessedBusLine,
	BusTimetableEntry,
} from '../views/transportation/bus/types'
import type {
	MasterCorIconMapType,
	MenuItemType as MenuItem,
} from '../views/menus/types'
import {Printer, PrintJob} from '../lib/stoprint/types'
import {JobType} from '../views/sis/student-work/types'
import {CourseType} from '../lib/course-search/types'
import {DirectoryItem, DirectorySearchTypeEnum} from '../views/directory/types'
import {ServerRoute} from '../views/settings/screens/api-test/query'
import type {RedditPostDetailParams} from '../views/reddit/types'

export type FaqRouteParams = {faqId?: string} | undefined

export type RootViewsParamList = {
	Home: undefined
	[calendar.NavigationKey]: calendar.NavigationParams
	Menus: undefined
	News: undefined
	[reddit.NavigationKey]: reddit.NavigationParams
	[sis.NavigationKey]: undefined
	'Streaming Media': undefined
	Transportation: undefined
	BuildingHours: undefined
	Contacts: undefined
	CourseSearch: undefined
	Dictionary: undefined
	Directory:
		| {queryType?: DirectorySearchTypeEnum; queryParam?: string}
		| undefined
	Faq: FaqRouteParams
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
	CourseSearchResults:
		| {initialQuery?: string; initialFilters?: FilterType<CourseType>[]}
		| undefined
	CourseDetail: {course: CourseType}
	StudentOrgsDetail: {org: StudentOrgType}
	BusMapView: {line: UnprocessedBusLine}
	BusRouteDetail: {
		stop: BusTimetableEntry
		line: UnprocessedBusLine
		subtitle: string
	}
	MenuItemDetail: {item: MenuItem; icons: MasterCorIconMapType}
	PrinterList: {job: PrintJob}
	PrintJobRelease: {job: PrintJob; printer?: Printer}
	RedditPostDetail: RedditPostDetailParams
}

export type RootStackParamList = RootViewsParamList &
	CafeMenuParamList &
	RadioScheduleParamList &
	MiscViewParamList

export type SettingsStackParamList = {
	APITest: undefined
	APITestDetail: {query: ServerRoute}
	BannerBuilder: undefined
	BonAppPicker: undefined
	Credits: undefined
	[debug.NavigationKey]: {keyPath: string[]}
	Faq: FaqRouteParams
	IconSettings: undefined
	Legal: undefined
	NetworkLogger: undefined
	Privacy: undefined
	ReportProblem: undefined
	Settings: undefined
	SettingsRoot: undefined
}

export type ComponentLibraryStackParamList = {
	ComponentLibraryRoot: undefined
	ComponentLibrary: undefined
	BadgeLibrary: undefined
	ButtonLibrary: undefined
	[settings.ColorsLibraryNavigationKey]: undefined
	ContextMenuLibrary: undefined
	FaqBannerLibrary: undefined
}

export interface ChangeTextEvent {
	nativeEvent: {text: React.SetStateAction<string>}
}

export interface OnChangeTextHandler {
	onChange: (event: ChangeTextEvent) => void
}

// Explicit, non-ambient replacement for the old global ReactNavigation.RootParamList
// augmentation: expo-router ships its own global `type RootParamList = {}`, which
// cannot coexist with an `interface` of the same name (TypeScript does not merge a
// type alias with an interface). Every useNavigation() call against the legacy
// React Navigation stack now takes this as an explicit generic instead
// (useNavigation<NavigationProp<LegacyRootParamList>>()) — see checkpoint 1's
// Task 4b. This type, and every file that imports it, goes away in checkpoint 7
// once the legacy stack is fully replaced by expo-router's own typed routes.
export type LegacyRootParamList = RootStackParamList &
	SettingsStackParamList &
	ComponentLibraryStackParamList
