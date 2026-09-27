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

type CommonView = {
	/** Stable across renames: pins, recents and collapsed groups are stored by it. */
	id: string
	/** The destination's full name, which VoiceOver reads and the screen is titled with. */
	title: string
	/** A shorter name for the tile, when the full one does not fit a quarter of the screen. */
	label?: string
	icon: NonNullable<ImageProps['systemName']>
	gradient: Gradient
	group: HomeGroupId
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

export const AllViews = (): Array<ViewType> => {
	return [
		// Eat
		{
			type: 'view',
			view: '/Menus',
			id: 'stav-hall',
			title: 'Stav Hall',
			label: 'Stav',
			icon: 'fork.knife',
			gradient: c.greenGradient,
			group: 'eat',
		},
		{
			type: 'view',
			view: '/Menus/the-cage',
			id: 'the-cage',
			title: 'The Cage',
			label: 'Cage',
			icon: 'cup.and.saucer.fill',
			gradient: c.orangeGradient,
			group: 'eat',
		},
		{
			type: 'view',
			view: '/Menus/the-pause',
			id: 'the-pause',
			title: 'The Pause',
			label: 'Pause',
			icon: 'pawprint.fill',
			gradient: c.redGradient,
			group: 'eat',
		},
		{
			type: 'view',
			view: '/SIS',
			id: 'balances',
			title: 'Balances',
			icon: 'creditcard.fill',
			gradient: c.goldGradient,
			group: 'eat',
		},

		// Get around
		{
			type: 'view',
			view: '/Map?campus=stolaf',
			id: 'map',
			title: 'Map',
			icon: 'map.fill',
			gradient: c.greenGradient,
			group: 'get-around',
		},
		{
			type: 'view',
			view: '/Hours',
			id: 'hours',
			title: 'Hours',
			icon: 'clock.fill',
			gradient: c.blueGradient,
			group: 'get-around',
		},
		{
			type: 'view',
			view: '/Transit',
			id: 'transit',
			title: 'Transit',
			icon: 'bus.fill',
			gradient: c.grayGradient,
			group: 'get-around',
		},
		{
			type: 'view',
			view: '/Directory',
			id: 'directory',
			title: 'Directory',
			icon: 'person.crop.rectangle.fill',
			gradient: c.redGradient,
			group: 'get-around',
		},

		// Classes & work
		{
			type: 'view',
			view: '/CourseSearch',
			id: 'course-catalog',
			title: 'Course Catalog',
			label: 'Catalog',
			icon: 'graduationcap.fill',
			gradient: c.tanGradient,
			group: 'classes-work',
		},
		{
			type: 'view',
			view: '/PrintJobs',
			id: 'stoprint',
			title: 'stoPrint',
			icon: 'printer.fill',
			gradient: c.yellowGradient,
			group: 'classes-work',
		},
		{
			type: 'view',
			view: '/StudentWork',
			id: 'student-work',
			title: 'Student Work',
			label: 'Jobs',
			icon: 'briefcase.fill',
			gradient: c.orangeGradient,
			group: 'classes-work',
		},

		// What's on
		{
			type: 'view',
			view: '/Calendar',
			id: 'calendar',
			title: 'Calendar',
			icon: 'calendar',
			gradient: c.violetGradient,
			group: 'whats-on',
		},
		{
			type: 'view',
			view: '/Athletics',
			id: 'athletics',
			title: 'Athletics',
			icon: 'trophy.fill',
			gradient: c.paleGoldGradient,
			group: 'whats-on',
		},
		{
			type: 'view',
			view: '/Messenger',
			id: 'olaf-messenger',
			title: 'Olaf Messenger',
			label: 'Messenger',
			icon: 'newspaper.fill',
			gradient: c.purpleGradient,
			group: 'whats-on',
		},
		{
			type: 'view',
			view: '/StudentOrgs',
			id: 'student-orgs',
			title: 'Student Orgs',
			label: 'Orgs',
			icon: 'person.3.fill',
			gradient: c.sageGradient,
			group: 'whats-on',
		},

		// Listen & watch
		{
			type: 'view',
			view: '/Streaming Media/ksto',
			id: 'ksto',
			title: 'KSTO',
			icon: 'radio.fill',
			gradient: c.purpleGradient,
			group: 'listen-watch',
		},
		{
			type: 'view',
			view: '/Streaming Media/krlx',
			id: 'krlx',
			title: 'KRLX',
			icon: 'mic.fill',
			gradient: c.violetGradient,
			group: 'listen-watch',
		},
		{
			type: 'view',
			view: '/Streaming Media',
			id: 'streams',
			title: 'Streams',
			icon: 'play.rectangle.fill',
			gradient: c.lightBlueGradient,
			group: 'listen-watch',
		},
		{
			type: 'view',
			view: '/Streaming Media/webcams',
			id: 'webcams',
			title: 'Webcams',
			icon: 'web.camera.fill',
			gradient: c.blueGradient,
			group: 'listen-watch',
		},

		// Just for fun
		{
			type: 'view',
			view: '/Dictionary',
			id: 'dictionary',
			title: 'Dictionary',
			icon: 'character.book.closed.fill',
			gradient: c.pinkGradient,
			group: 'just-for-fun',
		},
		{
			type: 'view',
			view: '/Messenger/crosswords',
			id: 'crossword',
			title: 'Crossword',
			icon: 'puzzlepiece.fill',
			gradient: c.mintGradient,
			group: 'just-for-fun',
		},

		// Help
		{
			type: 'view',
			view: '/Directory/named/PubSafe',
			id: 'pubsafe',
			title: 'PubSafe',
			icon: 'shield.lefthalf.filled',
			gradient: c.redGradient,
			group: 'help',
		},
		{
			type: 'view',
			view: '/Contacts',
			id: 'contacts',
			title: 'Contacts',
			icon: 'phone.fill',
			gradient: c.sageGradient,
			group: 'help',
		},
		{
			type: 'view',
			view: '/Faq',
			id: 'faq',
			title: 'FAQ',
			icon: 'questionmark.circle.fill',
			gradient: c.lightBlueGradient,
			group: 'help',
		},

		// Campus communications
		{
			type: 'view',
			view: '/StOlafNews',
			id: 'st-olaf-news',
			title: 'St. Olaf News',
			label: 'News',
			icon: 'megaphone.fill',
			gradient: c.indigoGradient,
			group: 'campus-communications',
		},
		{
			type: 'view',
			view: '/More',
			id: 'a-to-z',
			title: 'A–Z',
			icon: 'list.bullet.rectangle.fill',
			gradient: c.mintGradient,
			group: 'campus-communications',
		},

		// Dev
		{
			type: 'view',
			view: '/Hours?campus=carleton',
			id: 'carleton-campus',
			title: 'Carleton Campus',
			icon: 'building.2.fill',
			gradient: c.blueGradient,
			group: 'dev',
			devOnly: true,
		},
		{
			type: 'view',
			view: '/Menus/carleton',
			id: 'carleton-menus',
			title: 'Carleton Menus',
			icon: 'list.bullet',
			gradient: c.greenGradient,
			group: 'dev',
			devOnly: true,
		},
	]
}

export type HomeSection = HomeGroup & {views: ViewType[]}

/**
 * The groups home draws, each holding its views in registry order. A group
 * left with nothing to show -- Dev outside dev mode -- is dropped rather than
 * drawn as an empty header.
 */
export function homeSections(views: ViewType[], {isDev}: {isDev: boolean}): HomeSection[] {
	let shown = views.filter((view) => !view.disabled && (isDev || !view.devOnly))
	return HOME_GROUPS.map((group) => ({
		...group,
		views: shown.filter((view) => view.group === group.id),
	})).filter((section) => section.views.length > 0)
}
