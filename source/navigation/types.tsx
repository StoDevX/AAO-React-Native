// import React from 'react'

// import {HomeView} from '../views/home'
// import * as Calendar from '../views/calendar'
import { EventType } from '@frogpond/event-type'
import { PoweredBy } from '@frogpond/event-list'

import * as calendar from '../views/calendar'

export type RootStackParamList = {
	Home: undefined
	Profile: {userId: string}
	Feed: {sort: 'latest' | 'top'} | undefined
	EventDetail: {event: EventType, poweredBy: PoweredBy}
	BuildingHoursDetail: undefined
	BuildingHours: undefined
	BuildingHoursProblemReport: undefined
	BuildingHoursScheduleEditor: undefined
	[calendar.NavigationKey]: calendar.NavigationParams
	Contacts: undefined
	ContactsDetail: undefined
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
