import type {AboutSection, DataSource} from '../../features/about/campus-section'

/** The people the CARLS app credits, as carls-app/carls' data/credits.yaml lists them. It thanks no one besides. */
const carlsContributors: ReadonlyArray<string> = [
	'Drew Volz',
	'Elijah Verdoorn',
	'Erich Kauffman',
	'Grace Pipes',
	'Hannes Carlsen',
	'Hawken Rives',
	'Kristofer Rye',
	'Margaret Zimmermann',
	'Matt Kilens',
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

/** CARLS' About: its own writers and nobody else, no history, and its data sources. */
export const carletonAbout: AboutSection = {
	story: [],
	credits: [{id: 'contributors', heading: 'Contributors', names: carlsContributors}],
	dataSources: CARLETON_SOURCES,
}
