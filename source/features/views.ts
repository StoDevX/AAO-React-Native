import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import type {ImageProps} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'

import type {Campus} from './campus/store'
import type {StationId} from './streaming/radio/stations'

type r = typeof useRouter extends () => infer T ? T : never
type href = r extends {push: (href: infer H) => void} ? H : never

/**
 * Symbols drawn for the app rather than shipped with iOS. Each name is a
 * `.symbolset` in `assets/symbols/`, which `plugins/with-custom-symbols` copies
 * into the asset catalog.
 */
export const CUSTOM_SYMBOLS = ['olaf-messenger', 'carletonian'] as const

type CustomSymbol = (typeof CUSTOM_SYMBOLS)[number]

/** An SF Symbol's name, or a custom symbol's. */
export type SymbolName = NonNullable<ImageProps['systemName']> | CustomSymbol

function isCustomSymbol(name: SymbolName): name is CustomSymbol {
	return (CUSTOM_SYMBOLS as readonly string[]).includes(name)
}

/** The `Image` props that draw `name`, wherever its artwork lives. */
export function iconImage(
	name: SymbolName,
): {systemName: NonNullable<ImageProps['systemName']>} | {assetName: CustomSymbol} {
	return isCustomSymbol(name) ? {assetName: name} : {systemName: name}
}

type CommonView = {
	/** The destination's full name, which VoiceOver reads and the screen is titled with. */
	title: string
	icon: SymbolName
	/** The title's typeface, for a view whose own screens use another. */
	titleDesign?: 'serif'
	gradient: Gradient
	disabled?: boolean
	devOnly?: boolean
}

type NativeView = {
	type: 'view'
	view: href
}

type WebLinkView = {
	type: 'url' | 'browser-url'
	url: string
}

/** A radio station, whose tile opens the Now Playing sheet on it. */
type RadioView = {
	type: 'radio'
	station: StationId
}

export type ViewType = CommonView & (NativeView | WebLinkView | RadioView)

/** Whether tapping `view` leaves the app's own screens for a web page. */
export function opensInBrowser(view: ViewType): boolean {
	return view.type === 'url' || view.type === 'browser-url'
}

/** Where tapping `view` goes: a route, a URL, or a station. */
export function viewTarget(view: ViewType): string {
	switch (view.type) {
		case 'view':
			return typeof view.view === 'string' ? view.view : view.view.pathname
		case 'radio':
			return `radio:${view.station}`
		default:
			return view.url
	}
}

/** The views to draw: not disabled, and not for dev mode alone unless it is on. */
export function visibleViews<V extends ViewType>(views: V[], {isDev}: {isDev: boolean}): V[] {
	return views.filter((view) => !view.disabled && (isDev || !view.devOnly))
}

/**
 * The tiles of the home screen for `campus`, in the order both of its layouts
 * draw them. A view tiled here is also a quick action's destination.
 */
export const HomeViews = (campus: Campus = 'stolaf'): Array<ViewType> =>
	campus === 'carleton' ? carletonViews() : stOlafViews()

/** Both campuses end on the developer tile. */
const developerView = (): ViewType => ({
	type: 'view',
	view: '/developer',
	title: 'Developer',
	icon: 'hammer.fill',
	gradient: c.grayGradient,
	devOnly: true,
})

const stOlafViews = (): Array<ViewType> => [
	{
		type: 'view',
		view: '/menus',
		title: 'Menus',
		icon: 'fork.knife',
		gradient: c.greenGradient,
	},
	{
		type: 'url',
		url: 'https://sis.stolaf.edu/sis/index.cfm',
		title: 'Balances',
		icon: 'arrow.up.right',
		gradient: c.goldGradient,
	},
	// Balances opens SIS on the web instead. To bring the native screen
	// back, move `disabled` to the entry above.
	{
		type: 'view',
		view: '/balances',
		title: 'Balances',
		icon: 'person.text.rectangle.fill',
		gradient: c.goldGradient,
		disabled: true,
	},
	{
		type: 'view',
		view: '/hours',
		title: 'Hours',
		icon: 'clock.fill',
		gradient: c.blueGradient,
	},
	{
		type: 'view',
		view: '/calendar',
		title: 'Calendar',
		icon: 'calendar',
		gradient: c.violetGradient,
	},
	{
		type: 'view',
		view: '/directory',
		title: 'Directory',
		icon: 'person.crop.rectangle.fill',
		gradient: c.redGradient,
	},
	{
		type: 'view',
		view: '/streaming-media',
		title: 'Streaming Media',
		icon: 'play.rectangle.fill',
		gradient: c.lightBlueGradient,
	},
	{
		type: 'view',
		view: '/messenger',
		title: 'Olaf Messenger',
		icon: 'olaf-messenger',
		gradient: c.purpleGradient,
		titleDesign: 'serif',
	},
	{
		type: 'view',
		view: '/map?campus=stolaf',
		title: 'Map',
		icon: 'map.fill',
		gradient: c.greenGradient,
	},
	{
		type: 'view',
		view: '/transit',
		title: 'Transit',
		icon: 'bus.fill',
		gradient: c.grayGradient,
	},
	{
		type: 'view',
		view: '/dictionary',
		title: 'Dictionary',
		icon: 'character.book.closed.fill',
		gradient: c.pinkGradient,
	},
	{
		type: 'view',
		view: '/student-orgs',
		title: 'Student Orgs',
		icon: 'person.3.fill',
		gradient: c.sageGradient,
	},
	{
		type: 'view',
		view: '/more',
		title: 'More',
		icon: 'ellipsis.circle.fill',
		gradient: c.mintGradient,
	},
	{
		type: 'view',
		view: '/print-jobs',
		title: 'stoPrint',
		icon: 'printer.fill',
		gradient: c.yellowGradient,
	},
	{
		type: 'view',
		view: '/course-search',
		title: 'Course Catalog',
		icon: 'graduationcap.fill',
		gradient: c.tanGradient,
	},
	{
		type: 'view',
		view: '/student-work',
		title: 'Student Work',
		icon: 'briefcase.fill',
		gradient: c.orangeGradient,
	},
	{
		type: 'view',
		view: '/st-olaf-news',
		title: 'St. Olaf News',
		icon: 'megaphone.fill',
		gradient: c.indigoGradient,
	},
	{
		type: 'view',
		view: '/athletics',
		title: 'Athletics',
		icon: 'trophy.fill',
		gradient: c.paleGoldGradient,
		devOnly: true,
	},
	developerView(),
]

/**
 * The CARLS app's tiles, in its order and under its names. A CARLS tile whose
 * screen cannot yet read Carleton's data is left out rather than shown with
 * St. Olaf's.
 */
const carletonViews = (): Array<ViewType> => [
	{
		type: 'view',
		view: '/menus/burton',
		title: 'Menus',
		icon: 'fork.knife',
		gradient: c.greenGradient,
	},
	// The Hub, which the CARLS app linked to, was replaced by Workday.
	{
		type: 'url',
		url: 'https://www.carleton.edu/workday/',
		title: 'Workday',
		icon: 'briefcase.fill',
		gradient: c.goldGradient,
	},
	{
		type: 'view',
		view: '/hours?campus=carleton',
		title: 'Building Hours',
		icon: 'clock.fill',
		gradient: c.blueGradient,
	},
	{
		type: 'view',
		view: '/calendar',
		title: 'Calendar',
		icon: 'calendar',
		gradient: c.violetGradient,
	},
	{
		type: 'url',
		url: 'https://www.carleton.edu/directory/',
		title: 'Directory',
		icon: 'person.crop.rectangle.fill',
		gradient: c.redGradient,
	},
	{
		type: 'view',
		view: '/contacts',
		title: 'Important Contacts',
		icon: 'phone.fill',
		gradient: c.orangeGradient,
	},
	{
		type: 'radio',
		station: 'krlx',
		title: 'KRLX',
		icon: 'radio.fill',
		gradient: c.purpleGradient,
	},
	{
		type: 'view',
		view: '/carleton-sumo',
		title: 'SUMO',
		icon: 'film.fill',
		gradient: c.lightBlueGradient,
	},
	// The CARLS app's News tile, as the student paper: Carleton's own news is at the end.
	{
		type: 'view',
		view: '/carletonian',
		title: 'The Carletonian',
		icon: 'carletonian',
		gradient: c.tanGradient,
		titleDesign: 'serif',
	},
	{
		type: 'view',
		view: '/transit',
		title: 'Transportation',
		icon: 'bus.fill',
		gradient: c.grayGradient,
	},
	{
		type: 'view',
		view: '/carleton-convos',
		title: 'Convo',
		icon: 'building.columns.fill',
		gradient: c.indigoGradient,
	},
	{
		type: 'view',
		view: '/map?campus=carleton',
		title: 'Campus Map',
		icon: 'map.fill',
		gradient: c.greenGradient,
	},
	{
		type: 'view',
		view: '/dictionary',
		title: 'Dictionary',
		icon: 'character.book.closed.fill',
		gradient: c.pinkGradient,
	},
	// Carleton blocks ccc-server from its orgs list, so the tile opens the college's own.
	{
		type: 'url',
		url: 'https://www.carleton.edu/student-organizations/',
		title: 'Student Orgs',
		icon: 'person.3.fill',
		gradient: c.sageGradient,
	},
	{
		type: 'url',
		url: 'https://moodle.carleton.edu/',
		title: 'Moodle',
		icon: 'graduationcap.fill',
		gradient: c.yellowGradient,
	},
	{
		type: 'view',
		view: '/carleton-news',
		title: 'Carleton News',
		icon: 'megaphone.fill',
		gradient: c.indigoGradient,
	},
	developerView(),
]
