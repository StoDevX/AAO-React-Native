import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import {RootViewsParamList} from '../navigation/types'

import { NavigationKey as menus } from './menus'
import { NavigationKey as sis } from './sis'
import { NavigationKey as calendar } from './calendar'
import { NavigationKey as streaming } from './streaming'
import { NavigationKey as news } from './news'
import { NavigationKey as transportation } from './transportation'

const hours: keyof RootViewsParamList = 'BuildingHours'
const directory: keyof RootViewsParamList = 'Directory'
const importantContacts: keyof RootViewsParamList = 'Contacts'
const dictionary: keyof RootViewsParamList = 'Dictionary'
const studentOrgs: keyof RootViewsParamList = 'StudentOrgs'
const more: keyof RootViewsParamList = 'More'
const printJobs: keyof RootViewsParamList = 'PrintJobs'
const courseSearch: keyof RootViewsParamList = 'CourseSearch'

type CommonView = {
	title: string
	icon: string
	foreground: 'light' | 'dark'
	tint: string
	gradient?: Gradient
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

export const allViews: Array<ViewType> = [
	{
		type: 'view',
		view: menus,
		title: 'Menus',
		icon: 'bowl',
		foreground: 'light',
		tint: c.emerald,
		gradient: c.grassToLime,
	},
	{
		type: 'view',
		view: sis,
		title: 'SIS',
		icon: 'fingerprint',
		foreground: 'light',
		tint: c.goldenrod,
		gradient: c.yellowToGoldDark,
	},
	{
		type: 'view',
		view: hours,
		title: 'Building Hours',
		icon: 'clock',
		foreground: 'light',
		tint: c.wave,
		gradient: c.lightBlueToBlueDark,
	},
	{
		type: 'view',
		view: calendar,
		title: 'Calendar',
		icon: 'calendar',
		foreground: 'light',
		tint: c.coolPurple,
		gradient: c.magentaToPurple,
	},
	{
		type: 'view',
		view: directory,
		title: 'Directory',
		icon: 'v-card',
		foreground: 'light',
		tint: c.indianRed,
		gradient: c.redToPurple,
	},
	{
		type: 'view',
		view: streaming,
		title: 'Streaming Media',
		icon: 'video',
		foreground: 'light',
		tint: c.denim,
		gradient: c.lightBlueToBlueLight,
	},
	{
		type: 'view',
		view: news,
		title: 'News',
		icon: 'news',
		foreground: 'light',
		tint: c.eggplant,
		gradient: c.purpleToIndigo,
	},
	{
		type: 'url',
		url: 'https://www.myatlascms.com/map/index.php?id=294',
		title: 'Campus Map',
		icon: 'map',
		foreground: 'light',
		tint: c.coffee,
		gradient: c.navyToNavy,
	},
	{
		type: 'view',
		view: importantContacts,
		title: 'Important Contacts',
		icon: 'phone',
		foreground: 'light',
		tint: c.crimson,
		gradient: c.orangeToRed,
	},
	{
		type: 'view',
		view: transportation,
		title: 'Transportation',
		icon: 'address',
		foreground: 'light',
		tint: c.cardTable,
		gradient: c.grayToDarkGray,
	},
	{
		type: 'view',
		view: dictionary,
		title: 'Campus Dictionary',
		icon: 'open-book',
		foreground: 'light',
		tint: c.olive,
		gradient: c.pinkToHotpink,
	},
	{
		type: 'view',
		view: studentOrgs,
		title: 'Student Orgs',
		icon: 'globe',
		foreground: 'light',
		tint: c.wave,
		gradient: c.darkBlueToIndigo,
	},
	{
		type: 'view',
		view: more,
		title: 'More',
		icon: 'link',
		foreground: 'light',
		tint: c.lavender,
		gradient: c.seafoamToGrass,
	},
	{
		type: 'view',
		view: printJobs,
		title: 'stoPrint',
		icon: 'print',
		foreground: 'light',
		tint: c.periwinkle,
		gradient: c.tealToSeafoam,
	},
	{
		type: 'view',
		view: courseSearch,
		title: 'Course Catalog',
		icon: 'graduation-cap',
		foreground: 'light',
		tint: c.lavender,
		gradient: c.seafoamToGrass,
	},
	{
		type: 'url',
		url: 'https://oleville.com/',
		title: 'Oleville',
		icon: 'browser',
		foreground: 'dark',
		tint: c.periwinkle,
		gradient: c.yellowToGoldMid,
	},
]
