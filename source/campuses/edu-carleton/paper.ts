import type {Paper} from '../../features/newspaper/campus-section'

/**
 * Carleton's student paper. Sports sits under News on its site, and Comics, Horoscope and
 * Crosswords under The Bald Spot, its satire, so those are columns rather than sections. Its
 * `about` page is SNO's placeholder; the Contact page is the one it filled in.
 */
export const CARLETONIAN: Paper = {
	id: 'carletonian',
	title: 'The Carletonian',
	shortTitle: 'The Carletonian',
	label: 'Carletonian',
	site: 'thecarletonian.com',
	mainSections: ['News', 'Viewpoint', 'Features and Arts', 'The Bald Spot', 'Arb Notes'],
	logoMediaIds: new Set(),
	contactPageSlug: 'contact',
	masthead: {assetName: 'carletonian'},
}
