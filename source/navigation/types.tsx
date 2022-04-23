// import {HomeView} from '../views/home'
// import * as Calendar from '../views/calendar'
import {EventType} from '@frogpond/event-type'
import {PoweredBy} from '@frogpond/event-list'
import {BuildingType} from '../views/building-hours/types'

import * as calendar from '../views/calendar'
import {ContactType} from '../views/contacts/types'
import {Props as HoursEditorProps} from '../views/building-hours/report/editor'

export type RootStackParamList = {
	Home: undefined
	Profile: {userId: string}
	Feed: {sort: 'latest' | 'top'} | undefined
	EventDetail: {event: EventType; poweredBy: PoweredBy}
	BuildingHoursDetail: {building: BuildingType}
	BuildingHours: undefined
	BuildingHoursProblemReport: {initialBuilding: BuildingType}
	BuildingHoursScheduleEditor: HoursEditorProps['route']['params']
	[calendar.NavigationKey]: calendar.NavigationParams
	Contacts: undefined
	ContactsDetail: {contact: ContactType}
	Credits: undefined
	Debug: undefined
	APITest: undefined
	DictionaryDetail: undefined
	Dictionary: undefined
	DictionaryEditor: undefined
	Faq: undefined
	Help: undefined
	JobDetail: undefined
	Legal: undefined
	Menus: undefined
	BonAppPicker: undefined
	News: undefined
	Privacy: undefined
	Settings: undefined
	IconSettings: undefined
	SIS: undefined
	CourseSearchResults: undefined
	CourseDetail: undefined
	Streaming: undefined
	KSTOSchedule: undefined
	KRLXSchedule: undefined
	StudentOrgsDetail: undefined
	StudentOrgs: undefined
	Transportation: undefined
	OtherModesDetail: undefined
	CarletonBurtonMenu: undefined
	CarletonLDCMenu: undefined
	CarletonWeitzMenu: undefined
	CarletonSaylesMenu: undefined
	MenuItemDetail: undefined
	PrintJobs: undefined
	PrinterList: undefined
	PrintJobRelease: undefined
}

// this block sourced from https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace ReactNavigation {
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		interface RootParamList extends RootStackParamList {}
	}
}
