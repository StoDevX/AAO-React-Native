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
	| {
			type: 'figure'
			url: string
			/** The largest copy the image's srcset offers, for the zoom viewer; none when it offers no larger one */
			largeUrl?: string
			width: number
			height: number
			caption: string
	  }
	| {type: 'embed'; url: string}

/** A Mess category; `parent` is 0 for a top-level one. */
export type MessCategory = {id: number; name: string; parent: number}

export type Photo = {url: string; width: number; height: number}

/** A photo with the caption or credit printed under it. */
export type CaptionedPhoto = Photo & {
	caption: string
	/** The largest copy a body picture's srcset offers, for the zoom viewer; none when it offers no larger one */
	largeUrl?: string
}

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
	photo: CaptionedPhoto | null
	blocks: Block[]
	/** Which template draws the story */
	layout: StoryLayout
}

/** A post as the issue list reads it: enough to group it into an issue and choose the issue's lead. */
export type LightPost = {
	id: number
	/** The day it ran, as YYYY-MM-DD in the paper's own time zone */
	day: string
	title: string
	/** The top-level category, never a Featured flag */
	section: string | null
	/** Whether it belongs to a special edition, even when also filed under a print section */
	special: boolean
	/** Whether any Featured* category is present */
	featured: boolean
	/** Its featured photo's media id; null with none, or with the Mess logo */
	photo: number | null
	/** That photo's address, looked up with the rest of its page's; null when not found */
	photoUrl: string | null
}

/** One issue of the paper: a week's posts, or a week's special edition, with the strays that joined it. */
export type MessIssue = {
	/**
	 * Names the issue uniquely: `week:` or `special:`, and its week's Monday. A week can hold both a
	 * paper and a special edition, and an edition's day can change as more of its posts go up, so
	 * neither the week nor the day alone names it.
	 */
	key: string
	/** The issue's day, as YYYY-MM-DD in the paper's time zone */
	day: string
	/** How many posts it holds, strays included */
	count: number
	/** Its posts' ids, newest first, strays included, each once */
	storyIds: number[]
	/** The lead story, chosen from the light fields */
	leadId: number
	leadTitle: string
	/** The lead's photo's address; null when it has none, or it was not found */
	leadPhoto: string | null
	/** Whether the lead has a photo, whether or not its address was found */
	leadHasPhoto: boolean
	isSpecial: boolean
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

/** An Amuse Labs PuzzleMe puzzle, as the placeholder in a Crossword or Puzzle post names it. */
export type Puzzle = {
	/** PuzzleMe's name for the game, such as `crossword` or `wordrow` */
	type: string
	id: string
	set: string
}

/** How the reader lays a story out; every template falls back to `article`. */
export type StoryLayout =
	| {kind: 'article'}
	| {kind: 'horoscopes'; intro: Run[][]; signs: Array<{sign: ZodiacSign; reading: Run[][]}>}
	| {kind: 'image'; image: Photo}
	| {kind: 'poem'; stanzas: PoemLine[][]}
	| {kind: 'puzzle'; puzzle: Puzzle}
	| {kind: 'playlist'; spotify: SpotifyRef | null}
	| {kind: 'recipe'; intro: Block[]; sections: RecipeSection[]; after: Block[]}
	| {kind: 'feature'; images: CaptionedPhoto[]}
