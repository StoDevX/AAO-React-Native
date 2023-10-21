import * as c from '@frogpond/colors'
import {RootViewsParamList, MiscViewParamList} from '../navigation/types'

import {NavigationKey as menus} from './menus'
import {NavigationKey as sis} from './sis'
import {NavigationKey as calendar} from './calendar'
import {NavigationKey as streaming} from './streaming'
import {NavigationKey as news} from './news'
import {NavigationKey as transportation} from './transportation'

import {useCourseSearchRecentsScreen} from '@frogpond/app-config'

const hours: keyof RootViewsParamList = 'BuildingHours'
const directory: keyof RootViewsParamList = 'Directory'
const importantContacts: keyof RootViewsParamList = 'Contacts'
const dictionary: keyof RootViewsParamList = 'Dictionary'
const studentOrgs: keyof RootViewsParamList = 'StudentOrgs'
const more: keyof RootViewsParamList = 'More'
const printJobs: keyof RootViewsParamList = 'PrintJobs'
const courseSearch: keyof RootViewsParamList = 'CourseSearch'
const courseSearchResults: keyof MiscViewParamList = 'CourseSearchResults'

type CommonView = {
	title: string
	icon: string
	foreground: 'light' | 'dark'
	tint: string
	disabled?: boolean
}

type NativeView = {
	type: 'view'
	view: keyof RootViewsParamList
}

type WebLinkView = {
	type: 'url' | 'browser-url'
	url: string
}

export type ViewType = CommonView & (NativeView | WebLinkView)

export const AllViews = (): Array<ViewType> => {
	const showRecentCourseSearches = useCourseSearchRecentsScreen()

	return [
		{
			type: 'view',
			view: menus,
			title: 'Menus',
			icon: 'bowl',
			foreground: 'light',
			tint: c.grassToLime[0],
		},
		{
			type: 'view',
			view: sis,
			title: 'SIS',
			icon: 'fingerprint',
			foreground: 'light',
			tint: c.yellowToGoldDark[0],
		},
		{
			type: 'view',
			view: hours,
			title: 'Building Hours',
			icon: 'clock',
			foreground: 'light',
			tint: c.lightBlueToBlueDark[0],
		},
		{
			type: 'view',
			view: calendar,
			title: 'Calendar',
			icon: 'calendar',
			foreground: 'light',
			tint: c.magentaToPurple[0],
		},
		{
			type: 'view',
			view: directory,
			title: 'Directory',
			icon: 'v-card',
			foreground: 'light',
			tint: c.redToPurple[0],
		},
		{
			type: 'view',
			view: streaming,
			title: 'Streaming Media',
			icon: 'video',
			foreground: 'light',
			tint: c.lightBlueToBlueLight[0],
		},
		{
			type: 'view',
			view: news,
			title: 'News',
			icon: 'news',
			foreground: 'light',
			tint: c.purpleToIndigo[0],
		},
		{
			type: 'url',
			url: 'https://www.myatlascms.com/map/index.php?id=294',
			title: 'Campus Map',
			icon: 'map',
			foreground: 'light',
			tint: c.navyToNavy[0],
		},
		{
			type: 'view',
			view: importantContacts,
			title: 'Important Contacts',
			icon: 'phone',
			foreground: 'light',
			tint: c.orangeToRed[0],
		},
		{
			type: 'view',
			view: transportation,
			title: 'Transportation',
			icon: 'address',
			foreground: 'light',
			tint: c.grayToDarkGray[0],
		},
		{
			type: 'view',
			view: dictionary,
			title: 'Campus Dictionary',
			icon: 'open-book',
			foreground: 'light',
			tint: c.pinkToHotpink[0],
		},
		{
			type: 'view',
			view: studentOrgs,
			title: 'Student Orgs',
			icon: 'globe',
			foreground: 'light',
			tint: c.darkBlueToIndigo[0],
		},
		{
			type: 'view',
			view: more,
			title: 'More',
			icon: 'link',
			foreground: 'light',
			tint: c.seafoamToGrass[0],
		},
		{
			type: 'view',
			view: printJobs,
			title: 'stoPrint',
			icon: 'print',
			foreground: 'light',
			tint: c.tealToSeafoam[0],
		},
		{
			disabled: !showRecentCourseSearches,
			type: 'view',
			view: courseSearch,
			title: 'Course Catalog',
			icon: 'graduation-cap',
			foreground: 'light',
			tint: c.lavender,
		},
		{
			disabled: showRecentCourseSearches,
			type: 'view',
			view: courseSearchResults,
			title: 'Course Catalog',
			icon: 'lab-flask',
			foreground: 'light',
			tint: c.lavender,
		},
		{
			type: 'url',
			url: 'https://oleville.com/',
			title: 'Oleville',
			icon: 'browser',
			foreground: 'dark',
			tint: c.yellowToGoldMid[0],
		},
	]
}
