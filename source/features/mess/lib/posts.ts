import {decode, fastGetTrimmedText} from '@frogpond/html-lib'
import {z} from 'zod'
import {parseBlocks} from './blocks'
import type {Byline, MessCategory, MessStory} from '../types'

/**
 * The Mess logos, which the site uses as a stand-in when a story has no photo.
 * 28499 is the white logo that older Poetry and Short Story posts carry.
 */
export const MESS_LOGO_MEDIA_IDS: ReadonlySet<number> = new Set([35393, 22795, 28499])

const CategorySchema = z.object({id: z.number(), name: z.string(), parent: z.number()})

/** The Mess's category tree, with names decoded from HTML entities. */
export function parseMessCategories(body: unknown): MessCategory[] {
	return z
		.array(CategorySchema)
		.parse(body)
		.map((c) => ({...c, name: decode(c.name)}))
}

const TermSchema = z.object({id: z.number(), name: z.string(), taxonomy: z.string()})

const MediaSchema = z.object({
	id: z.number(),
	source_url: z.string(),
	caption: z.object({rendered: z.string()}).optional(),
	media_details: z.object({width: z.number(), height: z.number()}),
})

/// WordPress reports `date_gmt` as UTC but omits the marker.
function utcDate(dateGmt: string): Date {
	return new Date(dateGmt.endsWith('Z') ? dateGmt : `${dateGmt}Z`)
}

const PostSchema = z.object({
	id: z.number(),
	date_gmt: z.string().refine((date) => !Number.isNaN(utcDate(date).getTime())),
	link: z.string(),
	title: z.object({rendered: z.string()}),
	excerpt: z.object({rendered: z.string()}),
	content: z.object({rendered: z.string()}),
	categories: z.array(z.number()),
	featured_media: z.number(),
	_embedded: z
		.object({
			// WordPress embeds an error object here when the media id does not
			// resolve, so each entry is checked on its own.
			'wp:featuredmedia': z.array(z.unknown()).optional(),
			'wp:term': z.array(z.array(z.unknown())).optional(),
		})
		.optional(),
})

type Post = z.infer<typeof PostSchema>

/** Whether a category is one of the site's Featured flags rather than a section. */
const isFeaturedFlag = (name: string): boolean => /^featured\b/iu.test(name)

/** The sections that name a story whenever one is present, ahead of any other top-level category. */
const MAIN_SECTIONS = ['News', 'Opinions', 'Arts & Entertainment', 'Sports', 'Variety']

/** WordPress's default category, which never names a section. */
const UNCATEGORIZED = 'Uncategorized'

/** The top-level ancestor of a category, or undefined when the tree is broken. */
function rootOf(category: MessCategory, byId: Map<number, MessCategory>): MessCategory | undefined {
	let current: MessCategory | undefined = category
	// A cycle in the data would otherwise loop for ever.
	for (let depth = 0; current && current.parent !== 0 && depth < 10; depth++) {
		current = byId.get(current.parent)
	}
	return current?.parent === 0 ? current : undefined
}

/** Where a story sits: its section, the column within it, and whether it is featured. */
function placement(ids: number[], byId: Map<number, MessCategory>) {
	let placed = ids.flatMap((id) => {
		let category = byId.get(id)
		let root = category && rootOf(category, byId)
		return category && root ? [{category, root}] : []
	})
	let featured = placed.some(({category}) => isFeaturedFlag(category.name))
	// Neither a Featured* flag nor its children, such as Online Exclusive, name a section.
	let candidates = placed.filter(
		({root}) => !isFeaturedFlag(root.name) && root.name !== UNCATEGORIZED,
	)
	let chosen = candidates.find(({root}) => MAIN_SECTIONS.includes(root.name)) ?? candidates[0]
	let section = chosen?.root ?? null
	let column = candidates.find(
		({category, root}) => root === section && category !== section,
	)?.category
	return {section: section?.name ?? null, column: column?.name ?? null, featured}
}

/** The story's `staff_name` terms, from any term group. */
function bylinesOf(post: Post): Byline[] {
	let terms = (post._embedded?.['wp:term'] ?? []).flat()
	return terms.flatMap((raw) => {
		let term = TermSchema.safeParse(raw)
		return term.success && term.data.taxonomy === 'staff_name'
			? [{id: term.data.id, name: decode(term.data.name)}]
			: []
	})
}

/** The story's featured photo, or null when it has none or it is the Mess logo. */
function photoOf(post: Post): MessStory['photo'] {
	if (post.featured_media === 0 || MESS_LOGO_MEDIA_IDS.has(post.featured_media)) return null
	let media = MediaSchema.safeParse(post._embedded?.['wp:featuredmedia']?.[0])
	if (!media.success) return null
	return {
		url: media.data.source_url,
		width: media.data.media_details.width,
		height: media.data.media_details.height,
		caption: fastGetTrimmedText(media.data.caption?.rendered ?? ''),
	}
}

/** One validated post as a story. */
function toStory(post: Post, byId: Map<number, MessCategory>): MessStory {
	return {
		id: post.id,
		title: decode(post.title.rendered),
		excerpt: fastGetTrimmedText(post.excerpt.rendered),
		link: post.link,
		published: utcDate(post.date_gmt).toISOString(),
		...placement(post.categories, byId),
		bylines: bylinesOf(post),
		photo: photoOf(post),
		blocks: parseBlocks(post.content.rendered),
	}
}

/**
 * The Mess's posts as stories. A malformed post is skipped so one bad item
 * does not blank the feed; a non-empty feed that yields nothing means the
 * shape changed, and throws.
 */
export function parseMessPosts(body: unknown, categories: MessCategory[]): MessStory[] {
	let items = z.array(z.unknown()).parse(body)
	let byId = new Map(categories.map((c) => [c.id, c]))
	let stories = items.flatMap((raw) => {
		let post = PostSchema.safeParse(raw)
		return post.success ? [toStory(post.data, byId)] : []
	})
	if (items.length > 0 && stories.length === 0) {
		throw new Error('every Mess post was malformed')
	}
	return stories
}
