import * as c from '@frogpond/colors'
import type EntypoGlyphs from '@react-native-vector-icons/entypo/glyphmaps/Entypo.json'
import type {RootViewsParamList} from '../navigation/types'

type CommonView = {
	id: string
	title: string
	icon: keyof typeof EntypoGlyphs
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
	return [
		{
			id: 'menus',
			type: 'view',
			view: 'Menus',
			title: 'Menus',
			icon: 'bowl',
			foreground: 'light',
			tint: c.grassToLime[0],
		},
		{
			id: 'sis',
			type: 'view',
			view: 'SIS',
			title: 'SIS',
			icon: 'fingerprint',
			foreground: 'light',
			tint: c.yellowToGoldDark[0],
		},
		{
			id: 'building-hours',
			type: 'view',
			view: 'BuildingHours',
			title: 'Building Hours',
			icon: 'clock',
			foreground: 'light',
			tint: c.lightBlueToBlueDark[0],
		},
		{
			id: 'calendar',
			type: 'view',
			view: 'Calendar',
			title: 'Calendar',
			icon: 'calendar',
			foreground: 'light',
			tint: c.magentaToPurple[0],
		},
		{
			id: 'directory',
			type: 'view',
			view: 'Directory',
			title: 'Directory',
			icon: 'v-card',
			foreground: 'light',
			tint: c.redToPurple[0],
		},
		{
			id: 'streaming-media',
			type: 'view',
			view: 'Streaming Media',
			title: 'Streaming Media',
			icon: 'video',
			foreground: 'light',
			tint: c.lightBlueToBlueLight[0],
		},
		{
			id: 'news',
			type: 'view',
			view: 'News',
			title: 'News',
			icon: 'news',
			foreground: 'light',
			tint: c.purpleToIndigo[0],
		},
		{
			id: 'campus-map',
			type: 'url',
			url: 'https://www.myatlascms.com/map/index.php?id=294',
			title: 'Campus Map',
			icon: 'map',
			foreground: 'light',
			tint: c.navyToNavy[0],
		},
		{
			id: 'important-contacts',
			type: 'view',
			view: 'Contacts',
			title: 'Important Contacts',
			icon: 'phone',
			foreground: 'light',
			tint: c.orangeToRed[0],
		},
		{
			id: 'transportation',
			type: 'view',
			view: 'Transportation',
			title: 'Transportation',
			icon: 'address',
			foreground: 'light',
			tint: c.grayToDarkGray[0],
		},
		{
			id: 'campus-dictionary',
			type: 'view',
			view: 'Dictionary',
			title: 'Campus Dictionary',
			icon: 'open-book',
			foreground: 'light',
			tint: c.pinkToHotpink[0],
		},
		{
			id: 'student-orgs',
			type: 'view',
			view: 'StudentOrgs',
			title: 'Student Orgs',
			icon: 'globe',
			foreground: 'light',
			tint: c.darkBlueToIndigo[0],
		},
		{
			id: 'more',
			type: 'view',
			view: 'More',
			title: 'More',
			icon: 'link',
			foreground: 'light',
			tint: c.seafoamToGrass[0],
		},
		{
			id: 'stoprint',
			type: 'view',
			view: 'PrintJobs',
			title: 'stoPrint',
			icon: 'print',
			foreground: 'light',
			tint: c.tealToSeafoam[0],
		},
		{
			id: 'course-catalog',
			type: 'view',
			view: 'CourseSearch',
			title: 'Course Catalog',
			icon: 'graduation-cap',
			foreground: 'light',
			tint: c.lavender,
		},
		{
			id: 'oleville',
			type: 'url',
			url: 'https://oleville.com/',
			title: 'Oleville',
			icon: 'browser',
			foreground: 'dark',
			tint: c.yellowToGoldMid[0],
		},
	]
}
