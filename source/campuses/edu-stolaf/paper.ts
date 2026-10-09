import type {Paper} from '../../features/mess/campus-section'

/** St. Olaf's student paper. */
export const MESSENGER: Paper = {
	id: 'mess',
	title: 'The Olaf Messenger',
	shortTitle: 'The Mess',
	label: 'Olaf Messenger',
	site: 'olafmessenger.com',
	mainSections: ['News', 'Opinions', 'Arts & Entertainment', 'Sports', 'Variety'],
	// 28499 is the white logo that older Poetry and Short Story posts carry.
	logoMediaIds: new Set([35393, 22795, 28499]),
	contactPageSlug: 'about',
	masthead: {assetName: 'olaf-messenger-castle'},
	routes: {
		front: '/messenger',
		story: '/messenger/story',
		image: '/messenger/image',
		column: '/messenger/column',
		issue: '/messenger/issue',
		issueSection: '/messenger/issue-section',
		about: '/messenger/about',
		staff: '/messenger/staff',
		staffMember: '/messenger/staff/[id]',
		customize: '/messenger/customize',
	},
}
