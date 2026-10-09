import type {CampusDefinition} from './definition'
import {carletonHomeTiles} from './edu-carleton/home-tiles'

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
	contacts: {title: 'Important Contacts'},
	api: {
		defaultUrl: 'https://carleton.frogpond.tech/v1/',
		storageKey: 'settings:server-address:edu.carleton',
		devTitle: 'Carleton Server URL',
	},
} as const satisfies CampusDefinition
