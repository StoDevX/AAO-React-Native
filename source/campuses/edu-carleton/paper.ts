import type {Paper} from '../../features/mess/campus-section'

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
	routes: {
		front: '/carletonian',
		story: '/carletonian/story',
		image: '/carletonian/image',
		column: '/carletonian/column',
		issue: '/carletonian/issue',
		issueSection: '/carletonian/issue-section',
		about: '/carletonian/about',
		staff: '/carletonian/staff',
		staffMember: '/carletonian/staff/[id]',
		customize: '/carletonian/customize',
	},
}
