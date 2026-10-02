import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import type {ImageProps} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'

type r = typeof useRouter extends () => infer T ? T : never
type href = r extends {push: (href: infer H) => void} ? H : never

/** The groups home is divided into, in the order they are drawn. */
export type HomeGroupId =
	| 'eat'
	| 'get-around'
	| 'classes-work'
	| 'whats-on'
	| 'listen-watch'
	| 'just-for-fun'
	| 'help'
	| 'campus-communications'
	| 'dev'

export type HomeGroup = {
	id: HomeGroupId
	title: string
	/** Help stays open, so PubSafe and the crisis contacts are always one tap from home. */
	collapsible: boolean
}

export const HOME_GROUPS: ReadonlyArray<HomeGroup> = [
	{id: 'eat', title: 'Eat', collapsible: true},
	{id: 'get-around', title: 'Get Around', collapsible: true},
	{id: 'classes-work', title: 'Classes & Work', collapsible: true},
	{id: 'whats-on', title: "What's On", collapsible: true},
	{id: 'listen-watch', title: 'Listen & Watch', collapsible: true},
	{id: 'just-for-fun', title: 'Just for Fun', collapsible: true},
	{id: 'help', title: 'Help', collapsible: false},
	{id: 'campus-communications', title: 'Campus Communications', collapsible: true},
	{id: 'dev', title: 'Dev', collapsible: true},
]

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

/** A view the grouped home draws: it belongs to a group and has a stable name of its own. */
export type HomeView = ViewType & {
	/** Stable across renames: pins, recents and collapsed groups are stored by it. */
	id: string
	group: HomeGroupId
}

/** Whether tapping `view` leaves the app's own screens for a web page. */
export function opensInBrowser(view: ViewType): boolean {
	return view.type !== 'view'
}

export const AllViews = (): Array<HomeView> => {
	return [
		// Eat
		{
			type: 'view',
			view: '/menus',
			id: 'stav-hall',
			title: 'Stav Hall',
			icon: 'fork.knife',
			gradient: c.greenGradient,
			group: 'eat',
		},
		{
			type: 'view',
			view: '/menus/the-cage',
			id: 'the-cage',
			title: 'The Cage',
			icon: 'cup.and.saucer.fill',
			gradient: c.orangeGradient,
			group: 'eat',
		},
		{
			type: 'view',
			view: '/menus/the-pause',
			id: 'the-pause',
			title: 'The Pause',
			icon: 'pawprint.fill',
			gradient: c.redGradient,
			group: 'eat',
		},
		{
			type: 'url',
			url: 'https://sis.stolaf.edu/sis/index.cfm',
			id: 'balances',
			title: 'Balances',
			icon: 'arrow.up.right',
			gradient: c.goldGradient,
			group: 'eat',
		},
		// Balances opens SIS on the web instead. To bring the native screen
		// back, move `disabled` to the entry above.
		{
			type: 'view',
			view: '/balances',
			id: 'balances-screen',
			title: 'Balances',
			icon: 'creditcard.fill',
			gradient: c.goldGradient,
			group: 'eat',
			disabled: true,
		},

		// Get around
		{
			type: 'view',
			view: '/map?campus=stolaf',
			id: 'map',
			title: 'Map',
			icon: 'map.fill',
			gradient: c.greenGradient,
			group: 'get-around',
		},
		{
			type: 'view',
			view: '/hours',
			id: 'hours',
			title: 'Hours',
			icon: 'clock.fill',
			gradient: c.blueGradient,
			group: 'get-around',
		},
		{
			type: 'view',
			view: '/transit',
			id: 'transit',
			title: 'Transit',
			icon: 'bus.fill',
			gradient: c.grayGradient,
			group: 'get-around',
		},
		{
			type: 'view',
			view: '/directory',
			id: 'directory',
			title: 'Directory',
			icon: 'person.crop.rectangle.fill',
			gradient: c.redGradient,
			group: 'get-around',
		},

		// Classes & work
		{
			type: 'view',
			view: '/course-search',
			id: 'course-catalog',
			title: 'Course Catalog',
			icon: 'graduationcap.fill',
			gradient: c.tanGradient,
			group: 'classes-work',
		},
		{
			type: 'view',
			view: '/print-jobs',
			id: 'stoprint',
			title: 'stoPrint',
			icon: 'printer.fill',
			gradient: c.yellowGradient,
			group: 'classes-work',
		},
		{
			type: 'view',
			view: '/student-work',
			id: 'student-work',
			title: 'Student Work',
			icon: 'briefcase.fill',
			gradient: c.orangeGradient,
			group: 'classes-work',
		},

		// What's on
		{
			type: 'view',
			view: '/calendar',
			id: 'calendar',
			title: 'Calendar',
			icon: 'calendar',
			gradient: c.violetGradient,
			group: 'whats-on',
		},
		{
			type: 'view',
			view: '/athletics',
			id: 'athletics',
			title: 'Athletics',
			icon: 'trophy.fill',
			gradient: c.paleGoldGradient,
			group: 'whats-on',
		},
		{
			type: 'view',
			view: '/messenger',
			id: 'olaf-messenger',
			title: 'Olaf Messenger',
			icon: 'olaf-messenger',
			titleDesign: 'serif',
			gradient: c.purpleGradient,
			group: 'whats-on',
		},
		{
			type: 'view',
			view: '/student-orgs',
			id: 'student-orgs',
			title: 'Student Orgs',
			icon: 'person.3.fill',
			gradient: c.sageGradient,
			group: 'whats-on',
		},

		// Listen & watch
		{
			type: 'view',
			view: '/streaming-media/ksto',
			id: 'ksto',
			title: 'KSTO',
			icon: 'radio.fill',
			gradient: c.purpleGradient,
			group: 'listen-watch',
		},
		{
			type: 'view',
			view: '/streaming-media/krlx',
			id: 'krlx',
			title: 'KRLX',
			icon: 'mic.fill',
			gradient: c.violetGradient,
			group: 'listen-watch',
		},
		{
			type: 'view',
			view: '/streaming-media',
			id: 'streams',
			title: 'Streams',
			icon: 'play.rectangle.fill',
			gradient: c.lightBlueGradient,
			group: 'listen-watch',
		},
		{
			type: 'view',
			view: '/streaming-media/webcams',
			id: 'webcams',
			title: 'Webcams',
			icon: 'web.camera.fill',
			gradient: c.blueGradient,
			group: 'listen-watch',
		},

		// Just for fun
		{
			type: 'view',
			view: '/dictionary',
			id: 'dictionary',
			title: 'Dictionary',
			icon: 'character.book.closed.fill',
			gradient: c.pinkGradient,
			group: 'just-for-fun',
		},
		{
			type: 'view',
			view: '/messenger/crosswords',
			id: 'crossword',
			title: 'Crossword',
			icon: 'puzzlepiece.fill',
			gradient: c.mintGradient,
			group: 'just-for-fun',
		},

		// Help
		{
			type: 'view',
			view: '/directory/named/PubSafe',
			id: 'pubsafe',
			title: 'PubSafe',
			icon: 'shield.lefthalf.filled',
			gradient: c.redGradient,
			group: 'help',
		},
		{
			type: 'view',
			view: '/contacts',
			id: 'contacts',
			title: 'Contacts',
			icon: 'phone.fill',
			gradient: c.sageGradient,
			group: 'help',
		},
		{
			type: 'view',
			view: '/faq',
			id: 'faq',
			title: 'FAQ',
			icon: 'questionmark.circle.fill',
			gradient: c.lightBlueGradient,
			group: 'help',
		},

		// Campus communications
		{
			type: 'view',
			view: '/st-olaf-news',
			id: 'st-olaf-news',
			title: 'St. Olaf News',
			icon: 'megaphone.fill',
			gradient: c.indigoGradient,
			group: 'campus-communications',
		},
		{
			type: 'view',
			view: '/more',
			id: 'a-to-z',
			title: 'A–Z',
			icon: 'list.bullet.rectangle.fill',
			gradient: c.mintGradient,
			group: 'campus-communications',
		},

		// Dev
		{
			type: 'view',
			view: '/hours?campus=carleton',
			id: 'carleton-campus',
			title: 'Carleton Campus',
			icon: 'building.2.fill',
			gradient: c.blueGradient,
			group: 'dev',
			devOnly: true,
		},
		{
			type: 'view',
			view: '/menus/carleton',
			id: 'carleton-menus',
			title: 'Carleton Menus',
			icon: 'list.bullet',
			gradient: c.greenGradient,
			group: 'dev',
			devOnly: true,
		},
	]
}

export type HomeSection = HomeGroup & {views: HomeView[]}

/**
 * The groups home draws, each holding its views in registry order. A group
 * left with nothing to show -- Dev outside dev mode -- is dropped rather than
 * drawn as an empty header.
 */
export function homeSections(views: HomeView[], {isDev}: {isDev: boolean}): HomeSection[] {
	let shown = views.filter((view) => !view.disabled && (isDev || !view.devOnly))
	return HOME_GROUPS.map((group) => ({
		...group,
		views: shown.filter((view) => view.group === group.id),
	})).filter((section) => section.views.length > 0)
}

/**
 * The tiles of the tiled home: today's one flat grid, in its order. Menus and
 * Streaming Media are one tile each there, opening screens that tab between
 * their cafes and stations; the grouped home gives each its own tile.
 */
export const TiledViews = (): Array<ViewType> => {
	return [
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
		// back, move `disabled` to the entry above: the home grid keys tiles by
		// title, so only one Balances can be on at a time.
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
			titleDesign: 'serif',
			gradient: c.purpleGradient,
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
	]
}
