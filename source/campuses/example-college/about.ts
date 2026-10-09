import type {AboutSection} from '../../features/about/campus-section'

/** Wiki Monkeys' history, credits and data, all as made up as the college. */
export const exampleCollegeAbout: AboutSection = {
	story: [
		{
			period: '1887',
			story: 'Founded by a troop of monkeys who wanted a library above the treeline.',
		},
		{period: '2026', story: 'The app arrives, so the UI tests have somewhere to live.'},
	],
	credits: [{id: 'troop', heading: 'The Troop', names: ['Ada Ridge', 'Bo Cornice']}],
	dataSources: [{name: 'The fixtures', provides: 'Everything', url: 'https://college.example/'}],
}
