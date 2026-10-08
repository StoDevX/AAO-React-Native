/**
 * A student paper the reader can show. Both run WordPress with School Newspapers Online's theme,
 * so they share the post shape, the `staff_name` bylines and the staff profiles; what differs is
 * named here.
 */
export type Paper = {
	/** The paper's id in the sources manifest's news entries, and its query keys' prefix. */
	id: 'mess' | 'carletonian'
	/** The paper's full name, as its front page and Back buttons read it. */
	title: string
	/** What the paper's own words call it, as in "The Mess has no issues yet." */
	shortTitle: string
	/** How a failed fetch names the paper, as in "Olaf Messenger gallery fetch failed". */
	label: string
	/** The paper's site, as "Read on olafmessenger.com" names it. */
	site: string
	/**
	 * The print sections, in the paper's order. A story in one is placed in it ahead of any other
	 * top-level category; the Latest menu and a front page's shelves list them.
	 */
	mainSections: readonly string[]
	/** Media ids of the paper's logo, which its site uses as a stand-in for a story's photo. */
	logoMediaIds: ReadonlySet<number>
	/** The slug of the page the front page's Contact item shows. */
	contactPageSlug: string
	/** The paper's masthead in the navigation bar: a custom symbol, or its name set in type. */
	masthead: {assetName: 'olaf-messenger-castle'} | null
	/** The reader's screens for this paper. */
	routes: PaperRoutes
}

/** The routes of one paper's screens, each a route file under its own folder of `app/`. */
export type PaperRoutes = {
	front: '/messenger' | '/carletonian'
	story: '/messenger/story' | '/carletonian/story'
	image: '/messenger/image' | '/carletonian/image'
	column: '/messenger/column' | '/carletonian/column'
	issue: '/messenger/issue' | '/carletonian/issue'
	issueSection: '/messenger/issue-section' | '/carletonian/issue-section'
	about: '/messenger/about' | '/carletonian/about'
	staff: '/messenger/staff' | '/carletonian/staff'
	staffMember: '/messenger/staff/[id]' | '/carletonian/staff/[id]'
	customize: '/messenger/customize' | '/carletonian/customize'
}

/** St. Olaf's student paper. */
export const OLAF_MESSENGER_PAPER: Paper = {
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

/**
 * Carleton's student paper. Sports sits under News on its site, and Comics, Horoscope and
 * Crosswords under The Bald Spot, its satire, so those are columns rather than sections. Its
 * `about` page is SNO's placeholder; the Contact page is the one it filled in.
 */
export const CARLETONIAN_PAPER: Paper = {
	id: 'carletonian',
	title: 'The Carletonian',
	shortTitle: 'The Carletonian',
	label: 'Carletonian',
	site: 'thecarletonian.com',
	mainSections: ['News', 'Viewpoint', 'Features and Arts', 'The Bald Spot', 'Arb Notes'],
	logoMediaIds: new Set(),
	contactPageSlug: 'contact',
	masthead: null,
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
