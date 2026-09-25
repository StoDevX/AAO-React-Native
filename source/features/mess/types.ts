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
}

/** A writer's profile for one staff year. */
export type StaffProfile = {
	name: string
	bio: string
	photo: Photo | null
	/** The staff_year term, such as `2025-2026` */
	year: string
}
