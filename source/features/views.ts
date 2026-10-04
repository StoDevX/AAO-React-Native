import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import type {ImageProps} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'

type r = typeof useRouter extends () => infer T ? T : never
type href = r extends {push: (href: infer H) => void} ? H : never

/**
 * Symbols drawn for the app rather than shipped with iOS. Each name is a
 * `.symbolset` in `assets/symbols/`, which `plugins/with-custom-symbols` copies
 * into the asset catalog.
 */
export const CUSTOM_SYMBOLS = ['olaf-messenger'] as const

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

export type ViewType = CommonView & (NativeView | WebLinkView)

/** Whether tapping `view` leaves the app's own screens for a web page. */
export function opensInBrowser(view: ViewType): boolean {
	return view.type !== 'view'
}

/** The views to draw: not disabled, and not for dev mode alone unless it is on. */
export function visibleViews<V extends ViewType>(views: V[], {isDev}: {isDev: boolean}): V[] {
	return views.filter((view) => !view.disabled && (isDev || !view.devOnly))
}

/**
 * The tiles of the home screen, in the order both of its layouts draw them. A
 * view tiled here is also a quick action's destination.
 */
export const HomeViews = (): Array<ViewType> => [
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
	{
		type: 'view',
		view: '/hours?campus=carleton',
		title: 'Carleton Campus',
		icon: 'building.2.fill',
		gradient: c.blueGradient,
		devOnly: true,
	},
	{
		type: 'view',
		view: '/developer',
		title: 'Developer',
		icon: 'hammer.fill',
		gradient: c.grayGradient,
		devOnly: true,
	},
]
