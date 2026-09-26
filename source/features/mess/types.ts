/** A stretch of text sharing one style. Styles nest, so a run can be bold, italic and a link at once. */
export type Run = {
	text: string
	bold?: boolean
	italic?: boolean
	href?: string
}

/** One piece of a story body, in reading order. */
export type Block =
	| {type: 'paragraph'; runs: Run[]}
	| {type: 'list'; ordered: boolean; items: Run[][]}
	| {type: 'quote'; runs: Run[]}
	| {type: 'figure'; url: string; width: number; height: number; caption: string}
	| {type: 'embed'; url: string}

/** A Mess category; `parent` is 0 for a top-level one. */
export type MessCategory = {id: number; name: string; parent: number}

export type Photo = {url: string; width: number; height: number}

/** One `staff_name` term on a story. */
export type Byline = {id: number; name: string}

export type MessStory = {
	id: number
	title: string
	excerpt: string
	link: string
	/** ISO 8601 */
	published: string
	/** The top-level category, never a Featured flag */
	section: string | null
	/** A child category of the section, if any */
	column: string | null
	/** Whether any Featured* category is present */
	featured: boolean
	bylines: Byline[]
	/** Null when there is no photo, or the photo is the Mess logo */
	photo: (Photo & {caption: string}) | null
	blocks: Block[]
	/** Which template draws the story */
	layout: StoryLayout
}

/** A writer's profile for one staff year. */
export type StaffProfile = {
	name: string
	bio: string
	photo: Photo | null
	/** The staff_year term, such as `2025-2026` */
	year: string
}

/** A sign of the zodiac, as a lowercase key. */
export type ZodiacSign =
	| 'aries'
	| 'taurus'
	| 'gemini'
	| 'cancer'
	| 'leo'
	| 'virgo'
	| 'libra'
	| 'scorpio'
	| 'sagittarius'
	| 'capricorn'
	| 'aquarius'
	| 'pisces'

/** One line of a poem: its runs, and how many levels the poet indented it. */
export type PoemLine = {indent: number; runs: Run[]}

/** One labelled part of a recipe: what goes in, or what to do, one item per ingredient or step. */
export type RecipeSection = {label: string; kind: 'ingredients' | 'steps'; items: Run[][]}

/** A Spotify playlist, album or track, by Spotify's base-62 id. */
export type SpotifyRef = {kind: 'playlist' | 'album' | 'track'; id: string}

/** An Amuse Labs PuzzleMe puzzle, as the placeholder in a Crossword post names it. */
export type CrosswordPuzzle = {id: string; set: string}

/** How the reader lays a story out; every template falls back to `article`. */
export type StoryLayout =
	| {kind: 'article'}
	| {kind: 'horoscopes'; intro: Run[][]; signs: Array<{sign: ZodiacSign; reading: Run[][]}>}
	| {kind: 'image'; image: Photo}
	| {kind: 'poem'; stanzas: PoemLine[][]}
	| {kind: 'crossword'; puzzle: CrosswordPuzzle}
	| {kind: 'playlist'; spotify: SpotifyRef | null}
	| {kind: 'recipe'; intro: Block[]; sections: RecipeSection[]; after: Block[]}
