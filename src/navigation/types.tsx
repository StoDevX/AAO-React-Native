import React from 'react'
import * as eventList from '@frogpond/event-list'
import {FilterType} from '@frogpond/filter/types'

import {BuildingType} from '../app/building-hours/types'
import {ContactType} from '../app/contacts/types'
import {StudentOrgType} from '../app/student-orgs/types'
import {RouteParams as HoursEditorType} from '../app/building-hours/report/editor'
import {WordType} from '../app/dictionary/types'
import {
	UnprocessedBusLine,
	BusTimetableEntry,
} from '../views/transportation/bus/types'
import type {
	MasterCorIconMapType,
	MenuItemType as MenuItem,
} from '../app/menus/types'
import {Printer, PrintJob} from '../lib/stoprint/types'
import {JobType} from '../app/sis/student-work/types'
import {CourseType} from '../lib/course-search/types'
import {DirectoryItem, DirectorySearchTypeEnum} from '../app/directory/types'
import {ServerRoute} from '../app/settings/screens/api-test/query'

export type RootStackParamList = {
	settings: undefined
	stoprint: undefined
	faqs: undefined
	'contacts/detail': {contact: ContactType}
	'event-detail': eventList.EventDetail.ParamList
	'menus/dev-bonapp-picker': undefined
	'menus/carleton-burton': undefined
	'menus/carleton-ldc': undefined
	'menus/carleton-weitz': undefined
	'menus/carleton-sayles': undefined
	'menus/menu-item-detail': {item: MenuItem; icons: MasterCorIconMapType}
	directory:
		| {queryType?: DirectorySearchTypeEnum; queryParam?: string}
		| undefined
	'directory/detail': {contact: DirectoryItem}
	'building-hours/detail': {building: BuildingType}
	'building-hours/report': {initialBuilding: BuildingType}
	'building-hours/report/editor': HoursEditorType
	'dictionary/detail': {item: WordType}
	'dictionary/report/editor': {item: WordType}
	'student-orgs/detail': {org: StudentOrgType}
	'sis/student-work/detail': {job: JobType}
	'sis/course-search/results':
		| {initialQuery?: string; initialFilters?: FilterType<CourseType>[]}
		| undefined
	'sis/course-search/detail': {course: CourseType}
	'stoprint/printers': {job: PrintJob}
	'stoprint/print-release': {job: PrintJob; printer?: Printer}
	'transportation/map': {line: UnprocessedBusLine}
	'transportation/detail': {
		stop: BusTimetableEntry
		line: UnprocessedBusLine
		subtitle: string
	}
	'streaming/ksto-schedule': undefined
	'streaming/krlx-schedule': undefined
	'settings/screens/credits': undefined
	'settings/screens/privacy': undefined
	'settings/screens/legal': undefined
	'settings/screens/network-logger': undefined
	'settings/screens/api-test': undefined
	'settings/screens/api-test/detail': {query: ServerRoute}
	'settings/screens/debug': {keyPath: string[]} | undefined
	'settings/screens/overview/component-library': undefined
	'settings/screens/overview/component-library/badge': undefined
	'settings/screens/overview/component-library/button': undefined
	'settings/screens/overview/component-library/colors': undefined
	'settings/screens/overview/component-library/context-menu': undefined
}

export interface ChangeTextEvent {
	nativeEvent: {text: React.SetStateAction<string>}
}

export interface OnChangeTextHandler {
	onChange: (event: ChangeTextEvent) => void
}

declare global {
	namespace ReactNavigation {
		interface RootParamList extends RootStackParamList {}
	}
}
