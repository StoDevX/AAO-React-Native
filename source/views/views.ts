import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import {RootStackParamList} from '../navigation/types'
import oleville from '../../images/oleville.png'

type HomeIconType =
	| {type: 'icon'; name: string}
	| {type: 'image'; path: number | undefined}

type CommonView = {
	title: string
	icon: HomeIconType
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
		icon: {type: 'icon', name: 'bowl'},
		foreground: 'light',
		tint: c.emerald,
		gradient: c.grassToLime,
	},
	{
		type: 'view',
		view: 'SIS',
		title: 'SIS',
		icon: {type: 'icon', name: 'fingerprint'},
		foreground: 'light',
		tint: c.goldenrod,
		gradient: c.yellowToGoldDark,
	},
	{
		type: 'view',
		view: 'BuildingHours',
		title: 'Building Hours',
		icon: {type: 'icon', name: 'clock'},
		foreground: 'light',
		tint: c.wave,
		gradient: c.lightBlueToBlueDark,
	},
	{
		type: 'view',
		view: 'Calendar',
		title: 'Calendar',
		icon: {type: 'icon', name: 'calendar'},
		foreground: 'light',
		tint: c.coolPurple,
		gradient: c.magentaToPurple,
	},
	{
		type: 'url',
		url: 'https://www.stolaf.edu/directory',
		view: 'Directory',
		title: 'Directory',
		icon: {type: 'icon', name: 'v-card'},
		foreground: 'light',
		tint: c.indianRed,
		gradient: c.redToPurple,
	},
	{
		type: 'view',
		view: 'Streaming',
		title: 'Streaming Media',
		icon: {type: 'icon', name: 'video'},
		foreground: 'light',
		tint: c.denim,
		gradient: c.lightBlueToBlueLight,
	},
	{
		type: 'view',
		view: 'News',
		title: 'News',
		icon: {type: 'icon', name: 'news'},
		foreground: 'light',
		tint: c.eggplant,
		gradient: c.purpleToIndigo,
	},
	{
		type: 'url',
		url: 'https://www.myatlascms.com/map/index.php?id=294',
		view: 'Map',
		title: 'Campus Map',
		icon: {type: 'icon', name: 'map'},
		foreground: 'light',
		tint: c.coffee,
		gradient: c.navyToNavy,
	},
	{
		type: 'view',
		view: 'Contacts',
		title: 'Important Contacts',
		icon: {type: 'icon', name: 'phone'},
		foreground: 'light',
		tint: c.crimson,
		gradient: c.orangeToRed,
	},
	{
		type: 'view',
		view: 'Transportation',
		title: 'Transportation',
		icon: {type: 'icon', name: 'address'},
		foreground: 'light',
		tint: c.cardTable,
		gradient: c.grayToDarkGray,
	},
	{
		type: 'view',
		view: 'Dictionary',
		title: 'Campus Dictionary',
		icon: {type: 'icon', name: 'open-book'},
		foreground: 'light',
		tint: c.olive,
		gradient: c.pinkToHotpink,
	},
	{
		type: 'view',
		view: 'StudentOrgs',
		title: 'Student Orgs',
		icon: {type: 'icon', name: 'globe'},
		foreground: 'light',
		tint: c.wave,
		gradient: c.darkBlueToIndigo,
	},
	{
		type: 'url',
		url: 'https://moodle.stolaf.edu/',
		view: 'Moodle',
		title: 'Moodle',
		icon: {type: 'icon', name: 'graduation-cap'},
		foreground: 'light',
		tint: c.cantaloupe,
		gradient: c.yellowToGoldLight,
	},
	{
		type: 'view',
		view: 'Help',
		title: 'Report A Problem',
		icon: {type: 'icon', name: 'help'},
		foreground: 'light',
		tint: c.lavender,
		gradient: c.seafoamToGrass,
	},
	{
		type: 'view',
		view: 'PrintJobs',
		title: 'stoPrint',
		icon: {type: 'icon', name: 'print'},
		foreground: 'light',
		tint: c.periwinkle,
		gradient: c.tealToSeafoam,
	},
	{
		type: 'browser-url',
		url: 'https://oleville.com/',
		view: 'Oleville',
		title: 'Oleville',
		icon: {type: 'image', path: oleville},
		foreground: 'dark',
		tint: c.periwinkle,
		gradient: c.yellowToGoldMid,
	},
]

export const allViewNames: Array<string> = allViews.map((v) => v.view)
