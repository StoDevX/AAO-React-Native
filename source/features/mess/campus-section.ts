/**
 * A student paper the reader can show. Both run WordPress with School Newspapers Online's theme,
 * so they share the post shape, the `staff_name` bylines and the staff profiles; what differs is
 * named here.
 */
export type Paper = {
	/** The paper's id in the sources manifest's news entries, and its query keys' prefix. */
	id: 'mess' | 'carletonian' | 'valley-echo'
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
	masthead: {assetName: 'olaf-messenger-castle' | 'carletonian'} | null
	/** The paper publishes crosswords, which /newspaper/crosswords shows. */
	crosswords?: true
}

/** A campus's student paper, which the reader under `app/newspaper/` shows. */
export type PaperSection = Paper
