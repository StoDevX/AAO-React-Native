import {eventMapper} from '../features/streaming/radio/constants'
import type {CampusDefinition} from './definition'
import {stolafAbout} from './edu-stolaf/about'
import {BUNDLED_DIRECTORIES, BUNDLED_HOURS} from './edu-stolaf/bundled'
import {stolafHomeTiles} from './edu-stolaf/home-tiles'
import {menus} from './edu-stolaf/menus'
import {MESSENGER} from './edu-stolaf/paper'
import {KSTO} from './edu-stolaf/radio'

export const stolaf = {
	id: 'edu.stolaf',
	name: 'St. Olaf College',
	branding: {
		appName: 'All About Olaf',
		supportEmail: 'allaboutolaf@frogpond.tech',
		college: 'St. Olaf College',
		intro:
			'All About Olaf is a collaborative application created by alumni of St. Olaf College in Northfield, MN under the name StoDevX.',
		notices: [
			'☃️ An Unofficial App Project ☃️',
			'For students, by students',
			'By students, for students',
			'An unofficial St. Olaf app',
			'For Oles, by Oles',
			'☃️',
			'🦁',
			'Made with ❤️ in Northfield, MN',
		],
	},
	home: {tiles: stolafHomeTiles},
	support: {
		emergency: [
			{label: 'PubSafe', contact: 'PubSafe'},
			{label: 'SARN', contact: 'SARN'},
		],
	},
	contacts: {title: 'Contacts'},
	api: {
		defaultUrl: 'https://stolaf.frogpond.tech/v1/',
		storageKey: 'settings:server-address:edu.stolaf',
	},
	publishedAs: 'stolaf',
	map: {
		title: 'St. Olaf Map',
		// The median of St. Olaf's 128 map features.
		center: [-93.1839, 44.4618],
		credit: {label: 'St. Olaf College', url: 'https://wp.stolaf.edu/'},
		// Source ids in the sources manifest, not campus ids.
		style: {manifestId: 'stolaf-light'},
		darkStyle: {manifestId: 'stolaf-dark'},
		buildingLabelsLayer: 'campus_labels_buildings',
		venuesByBuilding: true,
		buildingDirectory: {bundled: BUNDLED_DIRECTORIES},
	},
	hours: {
		title: 'Hours',
		reportLabel: 'St. Olaf',
		// St. Olaf's map has a home tile of its own.
		showsMapButton: false,
		photos: true,
		bundled: BUNDLED_HOURS,
	},
	menus,
	transit: {},
	dictionary: {acceptsSuggestions: true},
	directory: {searchUrl: 'https://www.stolaf.edu/directory/'},
	calendar: {sources: ['stolaf', 'presence']},
	news: {
		// The college's own news site.
		source: {id: 'stolaf', title: 'St. Olaf News', thumbnail: 'stolaf'},
	},
	radio: {stations: [KSTO]},
	schedules: {
		entries: [
			{id: 'ksto', title: `${KSTO.stationName} Schedule`, calendar: 'ksto-schedule', eventMapper},
		],
	},
	paper: MESSENGER,
	quickActions: {defaults: ['Stav Menu', 'Cage Menu', 'Olaf Messenger', 'Transit']},
	appIcons: {groups: ['Classic', 'Windmill']},
	about: stolafAbout,
	faqs: {showsLegacyText: true},
	studentOrgs: {},
	streaming: {},
	athletics: {},
	printing: {},
	balances: {},
	more: {},
	courseCatalog: {},
	studentWork: {source: 'stolaf'},
} as const satisfies CampusDefinition
