import type {CampusDefinition} from './definition'
import {exampleCollegeAbout} from './example-college/about'
import {exampleCollegeHomeTiles} from './example-college/home-tiles'
import {menus} from './example-college/menus'
import {VALLEY_ECHO} from './example-college/paper'
import {KMNK} from './example-college/radio'

/**
 * A made-up campus for the UI tests and for trying the app by hand: every
 * section filled, every response a hand-written fixture
 * (source/features/campus/__fixtures__/example.college/). Its id reverses to
 * college.example, in the reserved .example domain, so no real campus can
 * claim it. Alpine monkeys, not jungle ones: they're from Norway Valley.
 */
export const exampleCollege = {
	id: 'example.college',
	name: 'The College of the Norway Valley Wiki Monkeys',
	devOnly: true,
	branding: {
		appName: 'Wiki Monkeys',
		supportEmail: 'help@college.example',
		college: 'The College of the Norway Valley Wiki Monkeys',
		intro:
			'Wiki Monkeys is the app of a college that does not exist, high in a valley that does not either. The UI tests live here.',
		notices: [
			'🐒 Swinging since 1887 🏔',
			'Above the treeline, below the clouds',
			'Mind the switchbacks',
		],
	},
	home: {tiles: exampleCollegeHomeTiles},
	support: {
		emergency: [{label: 'Ski Patrol', contact: 'Ski Patrol'}],
		helpdesk: {
			name: 'Basecamp',
			covers: 'Accounts, the network and lost carabiners',
			serviceCatalog: 'https://basecamp.college.example/',
			phoneNumber: '5555550100',
		},
	},
	contacts: {title: 'Contacts'},
	api: {
		defaultUrl: 'https://example.college.invalid/',
		storageKey: 'settings:server-address:example.college',
		fixtureServer: true,
	},
	map: {
		title: 'Valley Map',
		// A valley in Norway with no college in it.
		center: [10.42, 61.18],
		credit: {label: 'Wiki Monkeys', url: 'https://college.example/'},
		// MapLibre's public demo style: the tiles load natively, outside the fixtures.
		style: {url: 'https://demotiles.maplibre.org/style.json'},
		// The demo style serves Open Sans, not the Noto Sans the other campuses' styles do.
		labelFont: 'Open Sans Semibold',
		venuesByBuilding: true,
		buildingDirectory: {},
	},
	// Valley Map has a home tile of its own, as St. Olaf's map does.
	hours: {title: 'Building Hours', reportLabel: 'Wiki Monkeys', showsMapButton: false},
	menus,
	transit: {title: 'Transit'},
	dictionary: {acceptsSuggestions: false},
	directory: {searchUrl: 'https://directory.college.example/search'},
	calendar: {sources: ['wiki-monkeys']},
	radio: {stations: [KMNK]},
	paper: VALLEY_ECHO,
	quickActions: {defaults: ['Menus', 'Building Hours', 'Calendar', 'Valley Map']},
	about: exampleCollegeAbout,
	faqs: {},
	studentOrgs: {},
	streaming: {},
	athletics: {},
	printing: {},
	balances: {},
	more: {},
	courseCatalog: {},
	studentWork: {},
} as const satisfies CampusDefinition
