import type {AboutSection, DataSource, TimelineEra} from '../../features/about/campus-section'
import {GH_BASE_URL} from '../../lib/constants'

/** The app's history, newest first. */
const timeline: Array<TimelineEra> = [
	{
		period: '🏡 October 2017 — Today',
		story:
			'Alumni of St. Olaf — Hawken Rives, Kris Rye, and Drew Volz — develop and support the app in its current form. Rewritten from top to bottom in Typescript, this is the version you see today in the iOS App Store. It remains self-published and open-source, shows no ads, and the anonymous usage and crash data it sends can be turned off.',
	},
	{
		period: '🧱 July 2016 — September 2017',
		story:
			'This version was written in the summer of 2016, led by Elijah Verdoorn and assisted by Hawken Rives and Drew Volz. The app was supported and published by the Student Government Association (SGA) web team, called the Oleville Development Team.',
	},
	{
		period: '🏗 2014',
		story:
			'The first version of All About Olaf was an iOS app created by Drew Volz as an independent project, self-published and written in Objective-C.',
	},
]

/** People who wrote the app. */
const contributors: ReadonlyArray<string> = [
	'Anna Linden',
	'Drew Turnblad',
	'Drew Volz',
	'Elijah Verdoorn',
	'Erich Kauffman',
	'Hannes Carlsen',
	'Hawken Rives',
	'Kris Rye',
	'Margaret Zimmermann',
	'Matt Kilens',
]

/** People who helped without writing code. */
const acknowledgements: ReadonlyArray<string> = [
	'Brandon Cash',
	'Catherine Paro',
	'Dan Beach',
	'Derek Hanson',
	'Emma Lind',
	'Kris Vatter',
	'Laura Mascotti',
	'Myron Engle',
	'Nick Nooney',
	'Sarah Bresnahan',
	'William Seabrook',
]

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

/** All About Olaf's story, its writers and helpers, and its data sources. */
export const stolafAbout: AboutSection = {
	story: timeline,
	credits: [
		{id: 'contributors', heading: 'Contributors', names: contributors},
		{id: 'acknowledgements', heading: 'Acknowledgements', names: acknowledgements},
	],
	dataSources: STOLAF_SOURCES,
}
