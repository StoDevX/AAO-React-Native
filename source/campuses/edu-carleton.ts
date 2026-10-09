import type {CampusDefinition} from './definition'
import {carletonAbout} from './edu-carleton/about'
import {carletonHomeTiles} from './edu-carleton/home-tiles'
import {menus} from './edu-carleton/menus'
import {CARLETONIAN} from './edu-carleton/paper'
import {KRLX} from './edu-carleton/radio'

export const carleton = {
	id: 'edu.carleton',
	name: 'Carleton College',
	branding: {
		appName: 'CARLS',
		supportEmail: 'carls@frogpond.tech',
		college: 'Carleton College',
		// CARLS' own, as carls-app/carls' data/credits.yaml has it.
		intro:
			"CARLS is an application created by Hawken Rives, based off of the app All About Olaf, which was a result of collaboration between student and alumni of St. Olaf College. It was inspired by the original 'All About Olaf', an iOS application created by Drew Volz as an independent project in 2014.",
		// The CARLS app's own notices.
		notices: [
			'☃️🍃 An Unofficial App Project ⛱🍂',
			'An unofficial Carleton app',
			'🐧',
			'For students, by students',
			'Made with ❤️ in Northfield, MN',
		],
	},
	home: {tiles: carletonHomeTiles},
	support: {
		emergency: [{label: 'Security', contact: 'Security Services'}],
		// Carleton's ITS Helpdesk, which CARLS' Report a Problem screen offered.
		helpdesk: {
			name: 'ITS',
			covers: 'Accounts, passwords, classroom tech, printing and the network',
			serviceCatalog:
				'https://stolafcarleton.teamdynamix.com/TDClient/2092/Carleton/Requests/ServiceCatalog',
			phoneNumber: '5072225999',
		},
	},
	contacts: {title: 'Directory', directoryUrl: 'https://www.carleton.edu/directory/'},
	api: {
		defaultUrl: 'https://carleton.frogpond.tech/v1/',
		storageKey: 'settings:server-address:edu.carleton',
	},
	publishedAs: 'carleton',
	map: {
		title: 'Carleton Map',
		// Predates the map reading its campus from the route; kept exactly as it was.
		center: [-93.15488752015, 44.460800862266],
		credit: {label: 'Carleton College', url: 'https://www.carleton.edu/'},
		// carls-app/map-tiles' z/x/y style, which has no dark variant.
		style: {url: 'https://carls-app.github.io/map-tiles/style.json'},
		// carls-app/map-data's scrape of Carleton's map. ccc-server stores bare
		// filenames (`leighton.jpg`), so a record is useless without this prefix.
		photoRoot: 'https://carls-app.github.io/map-data/cache/img',
	},
	hours: {
		title: 'Building Hours',
		reportLabel: 'Carleton',
		// Carleton's map has no home tile, so Hours carries the way to it.
		showsMapButton: true,
	},
	menus,
	// CARLS named the tile Transportation.
	transit: {title: 'Transportation'},
	// A suggestion is mailed to CARLS's support address.
	dictionary: {acceptsSuggestions: true},
	calendar: {sources: ['carleton']},
	news: {
		// Carleton Now, read through Carleton's server.
		source: {id: 'carleton-now', title: 'Carleton News', thumbnail: false},
	},
	radio: {stations: [KRLX]},
	convos: {},
	paper: CARLETONIAN,
	// A Carleton install's starting picks: the CARLS tiles reached most.
	quickActions: {defaults: ['Menus', 'Building Hours', 'SUMO', 'Convo']},
	appIcons: {groups: ['CARLS'], default: 'carls-penguin'},
	about: carletonAbout,
	// St. Olaf's server serves both campuses' notices; moving Carleton's onto its own is for later.
	faqs: {server: 'edu.stolaf'},
	// No printing yet. Carleton runs PaperCut too, at
	// https://print.ads.carleton.edu:9192/ (its sign-in page is /user), where
	// St. Olaf's is papercut.stolaf.edu, which source/lib/stoprint/urls.ts
	// hard-codes. Turning it on means giving `PrintingSection` the PaperCut
	// address, port included, building stoPrint's clients from the active
	// campus's section rather than from urls.ts, then adding `printing` here.
} as const satisfies CampusDefinition
