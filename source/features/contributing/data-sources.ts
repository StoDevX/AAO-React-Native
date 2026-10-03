import {GH_BASE_URL} from '../../lib/constants'

/** Somewhere the app gets its data, and what it takes from there. */
export type DataSource = {
	name: string
	provides: string
	url: string
}

/** Where the app's data comes from. */
export const dataSources: Array<DataSource> = [
	{
		name: 'St. Olaf College',
		provides: 'News, the calendar, the A–Z index, student work postings and student wages',
		url: 'https://wp.stolaf.edu/',
	},
	{
		name: 'The Olaf Messenger',
		provides: 'The student newspaper',
		url: 'https://olafmessenger.com/',
	},
	{
		name: 'Presence',
		provides: 'Student organization events',
		url: 'https://presence.io/',
	},
	{
		name: 'Bon Appétit',
		provides: 'Dining menus and café hours',
		url: 'https://stolaf.cafebonappetit.com/',
	},
	{
		name: 'KSTO',
		provides: 'The radio station’s weekly show schedule',
		url: 'https://www.kstoradio.org/',
	},
	{
		name: 'Three Rivers transit',
		provides: 'Bus schedules',
		url: 'https://data.trilliumtransit.com/gtfs/threerivers-mn-us/',
	},
	{
		name: 'StoDevX',
		provides:
			'Building hours, contacts, FAQs and the dictionary, kept in the app’s public repository',
		url: `${GH_BASE_URL}/tree/master/data`,
	},
]
