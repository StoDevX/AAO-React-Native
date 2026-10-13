import type {AboutSection} from '../../features/about/campus-section'

/** Wiki Monkeys' history, credits and data, all as made up as the college. */
export const exampleCollegeAbout: AboutSection = {
	story: [
		{
			period: '🏔 2026 — Today',
			story: 'The app arrives, so the UI tests have somewhere to live.',
		},
		{
			period: '🚡 1952 — 2025',
			story: 'The lift goes in, and the college spends its winters on the slopes.',
		},
		{
			period: '🐒 1887 — 1951',
			story: 'Founded by a troop of monkeys who wanted a library above the treeline.',
		},
	],
	credits: [
		{id: 'troop', heading: 'The Troop', names: ['Ada Ridge', 'Bo Cornice']},
		{id: 'thanks', heading: 'With Thanks To', names: ['The Ski Patrol', 'KMNK 91.7, The Peak']},
	],
	dataSources: [{name: 'The fixtures', provides: 'Everything', url: 'https://college.example/'}],
}
