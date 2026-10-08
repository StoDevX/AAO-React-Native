import {GH_BASE_URL} from '../../lib/constants'
import type {Campus} from '../campus/store'

/** Somewhere the app gets its data, and what it takes from there. */
export type DataSource = {
	name: string
	provides: string
	url: string
}

/** Where St. Olaf's data comes from. */
const STOLAF_SOURCES: Array<DataSource> = [
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
		url: 'https://stolaf.presence.io/organizations',
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
		name: 'KRLX',
		provides: 'Carleton’s radio station: its stream, schedule and what’s playing',
		url: 'https://www.krlx.org/',
	},
	{
		name: 'Three Rivers Community Action',
		provides: 'Bus schedules',
		url: 'https://www.threeriverscap.org/',
	},
	{
		name: 'StoDevX',
		provides:
			'Building hours, contacts, FAQs and the dictionary, kept in the app’s public repository',
		url: `${GH_BASE_URL}/tree/master/data`,
	},
]

/** Where Carleton's data comes from. */
const CARLETON_SOURCES: Array<DataSource> = [
	{
		name: 'Carleton College',
		provides: 'News, the calendar and convocations',
		url: 'https://www.carleton.edu/',
	},
	{
		name: 'The Carletonian',
		provides: 'The student newspaper',
		url: 'https://thecarletonian.com/',
	},
	{
		name: 'SUMO',
		provides: 'The film schedule',
		url: 'https://www.carleton.edu/student/orgs/sumo/',
	},
	{
		name: 'Bon Appétit',
		provides: 'Dining menus and café hours',
		url: 'https://carleton.cafebonappetit.com/',
	},
	{
		name: 'KRLX',
		provides: 'The radio station: its stream, schedule and what’s playing',
		url: 'https://www.krlx.org/',
	},
	{
		name: 'CARLS',
		provides:
			'Building hours, contacts, transportation and the dictionary, kept in the CARLS app’s public repository',
		url: 'https://github.com/carls-app/carls/tree/master/data',
	},
]

/** Where the app's data comes from on `campus`. */
export const dataSourcesFor = (campus: Campus): Array<DataSource> =>
	campus === 'carleton' ? CARLETON_SOURCES : STOLAF_SOURCES
