import * as c from '../modules/colors'

import {useCourseSearchRecentsScreen} from '../modules/app-config'

interface CommonView {
	title: string
	icon: string
	foreground: 'light' | 'dark'
	tint: string
	disabled?: boolean
}

interface NativeView {
	type: 'view'
	view: string
}

interface WebLinkView {
	type: 'url' | 'browser-url'
	url: string
}

export type ViewType = CommonView & (NativeView | WebLinkView)

export const AllViews = (): ViewType[] => {
	const showRecentCourseSearches = useCourseSearchRecentsScreen()

	return [
		{
			type: 'view',
			view: 'SIS',
			title: 'SIS',
			icon: 'fingerprint',
			foreground: 'light',
			tint: c.yellowToGoldDark[0],
		},
		{
			type: 'view',
			view: 'BuildingHours',
			title: 'Building Hours',
			icon: 'clock',
			foreground: 'light',
			tint: c.lightBlueToBlueDark[0],
		},
		{
			type: 'view',
			view: 'Calendar',
			title: 'Calendar',
			icon: 'calendar',
			foreground: 'light',
			tint: c.magentaToPurple[0],
		},
		{
			type: 'view',
			view: 'Directory',
			title: 'Directory',
			icon: 'v-card',
			foreground: 'light',
			tint: c.redToPurple[0],
		},
		{
			type: 'view',
			view: 'Streaming Media',
			title: 'Streaming Media',
			icon: 'video',
			foreground: 'light',
			tint: c.lightBlueToBlueLight[0],
		},
		{
			type: 'view',
			view: 'News',
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
			view: 'Contacts',
			title: 'Important Contacts',
			icon: 'phone',
			foreground: 'light',
			tint: c.orangeToRed[0],
		},
		{
			type: 'view',
			view: 'Dictionary',
			title: 'Campus Dictionary',
			icon: 'open-book',
			foreground: 'light',
			tint: c.pinkToHotpink[0],
		},
		{
			type: 'view',
			view: 'StudentOrgs',
			title: 'Student Orgs',
			icon: 'globe',
			foreground: 'light',
			tint: c.darkBlueToIndigo[0],
		},
		{
			type: 'view',
			view: 'More',
			title: 'More',
			icon: 'link',
			foreground: 'light',
			tint: c.seafoamToGrass[0],
		},
		{
			type: 'view',
			view: 'PrintJobs',
			title: 'stoPrint',
			icon: 'print',
			foreground: 'light',
			tint: c.tealToSeafoam[0],
		},
		{
			disabled: !showRecentCourseSearches,
			type: 'view',
			view: 'CourseSearch',
			title: 'Course Catalog',
			icon: 'graduation-cap',
			foreground: 'light',
			tint: c.lavender,
		},
		{
			disabled: showRecentCourseSearches,
			type: 'view',
			view: 'CourseSearchResults',
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
