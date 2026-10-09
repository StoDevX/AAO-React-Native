import {SUPPORT_EMAIL} from '../lib/constants'
import type {CampusDefinition} from './definition'
import {stolafHomeTiles} from './edu-stolaf/home-tiles'

export const stolaf = {
	id: 'edu.stolaf',
	name: 'St. Olaf College',
	branding: {
		appName: 'All About Olaf',
		supportEmail: SUPPORT_EMAIL,
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
} as const satisfies CampusDefinition
