import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import {RootStackParamList} from '../navigation/types'

type CommonView = {
	title: string
	icon: string
	foreground: 'light' | 'dark'
	tint: string
	gradient?: Gradient
}

type NativeView = {
	type: 'view'
	view: keyof RootStackParamList
}

type WebLinkView = {
	type: 'url' | 'browser-url'
	url: string
	view: string
}

export type ViewType = CommonView & (NativeView | WebLinkView)

export const allViews: Array<ViewType> = [
	{
		type: 'view',
		view: 'Menus',
		title: 'Menus',
		icon: 'bowl',
		foreground: 'light',
		tint: c.emerald,
		gradient: c.grassToLime,
	},
	{
		type: 'view',
		view: 'SIS',
		title: 'SIS',
		icon: 'fingerprint',
		foreground: 'light',
		tint: c.goldenrod,
		gradient: c.yellowToGoldDark,
	},
	{
		type: 'view',
		view: 'BuildingHours',
		title: 'Building Hours',
		icon: 'clock',
		foreground: 'light',
		tint: c.wave,
		gradient: c.lightBlueToBlueDark,
	},
	{
		type: 'view',
		view: 'Calendar',
		title: 'Calendar',
		icon: 'calendar',
		foreground: 'light',
		tint: c.coolPurple,
		gradient: c.magentaToPurple,
	},
	{
		type: 'view',
		view: 'Directory',
		title: 'Directory',
		icon: 'v-card',
		foreground: 'light',
		tint: c.indianRed,
		gradient: c.redToPurple,
	},
	{
		type: 'view',
		view: 'Streaming',
		title: 'Streaming Media',
		icon: 'video',
		foreground: 'light',
		tint: c.denim,
		gradient: c.lightBlueToBlueLight,
	},
	{
		type: 'view',
		view: 'News',
		title: 'News',
		icon: 'news',
		foreground: 'light',
		tint: c.eggplant,
		gradient: c.purpleToIndigo,
	},
	{
		type: 'url',
		url: 'https://www.myatlascms.com/map/index.php?id=294',
		view: 'Map',
		title: 'Campus Map',
		icon: 'map',
		foreground: 'light',
		tint: c.coffee,
		gradient: c.navyToNavy,
	},
	{
		type: 'view',
		view: 'Contacts',
		title: 'Important Contacts',
		icon: 'phone',
		foreground: 'light',
		tint: c.crimson,
		gradient: c.orangeToRed,
	},
	{
		type: 'view',
		view: 'Transportation',
		title: 'Transportation',
		icon: 'address',
		foreground: 'light',
		tint: c.cardTable,
		gradient: c.grayToDarkGray,
	},
	{
		type: 'view',
		view: 'Dictionary',
		title: 'Campus Dictionary',
		icon: 'open-book',
		foreground: 'light',
		tint: c.olive,
		gradient: c.pinkToHotpink,
	},
	{
		type: 'view',
		view: 'StudentOrgs',
		title: 'Student Orgs',
		icon: 'globe',
		foreground: 'light',
		tint: c.wave,
		gradient: c.darkBlueToIndigo,
	},
	{
		type: 'view',
		view: 'More',
		title: 'More',
		icon: 'link',
		foreground: 'light',
		tint: c.lavender,
		gradient: c.seafoamToGrass,
	},
	{
		type: 'view',
		view: 'PrintJobs',
		title: 'stoPrint',
		icon: 'print',
		foreground: 'light',
		tint: c.periwinkle,
		gradient: c.tealToSeafoam,
	},
	{
		type: 'view',
		view: 'CourseSearch',
		title: 'Course Catalog',
		icon: 'graduation-cap',
		foreground: 'light',
		tint: c.lavender,
		gradient: c.seafoamToGrass,
	},
	{
		type: 'url',
		url: 'https://oleville.com/',
		view: 'Oleville',
		title: 'Oleville',
		icon: 'browser',
		foreground: 'dark',
		tint: c.periwinkle,
		gradient: c.yellowToGoldMid,
	},
]

export const allViewNames: Array<string> = allViews.map((v) => v.view)
