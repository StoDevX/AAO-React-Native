import {fastGetTrimmedText} from '@frogpond/html-lib'
import {z} from 'zod'
import {StoryType} from '../types'

// WordPress embeds an error object (e.g. `{code: "rest_user_invalid_id", ...}`,
// with none of the expected fields) instead of the real embed whenever the
// embedded id — an author, a featured-media attachment, a term — doesn't
// resolve. Every embed shape below is optional for that reason: their
// absence just means "no byline" / "no image" / "no category", not that the
// post itself is broken. The post's own fields (title, link, content, ...)
// stay required, because a post genuinely missing one of those is unusable
// and `parseWpV2Posts` now skips unusable posts individually rather than
// failing the whole feed.
const WpV2PostSchema = z.object({
	_embedded: z
		.object({
			author: z
				.array(z.object({id: z.unknown().optional(), name: z.string().optional()}))
				.optional(),
			'wp:featuredmedia': z
				.array(
					z.object({
						id: z.unknown().optional(),
						media_type: z.string().optional(),
						media_details: z
							.object({
								sizes: z.record(z.string(), z.object({source_url: z.string()})).optional(),
							})
							.optional(),
						source_url: z.string().optional(),
					}),
				)
				.nullable()
				.optional(),
			'wp:term': z
				.array(z.array(z.object({taxonomy: z.string().optional(), name: z.string().optional()})))
				.optional(),
		})
		.optional(),
	author: z.unknown(),
	featured_media: z.number().optional(),
	content: z.object({rendered: z.string()}),
	excerpt: z.object({rendered: z.string()}),
	title: z.object({rendered: z.string()}),
	date_gmt: z.string(),
	link: z.string(),
})

/// WordPress reports `date_gmt` as UTC but omits the marker, so an unadorned
/// value would be read as local time and shift by the offset.
function toIsoString(dateGmt: string): string {
	let stamped = dateGmt.endsWith('Z') || dateGmt.includes('+') ? dateGmt : `${dateGmt}Z`
	return new Date(stamped).toISOString()
}

function toStory(item: z.infer<typeof WpV2PostSchema>): StoryType {
	let categories =
		item._embedded?.['wp:term']?.flatMap((group) =>
			group.flatMap((term) => (term.taxonomy === 'category' && term.name ? [term.name] : [])),
		) ?? []

	let author = item._embedded?.author?.find((a) => a.id === item.author)?.name ?? 'Unknown Author'

	let featuredImage: string | undefined
	let media = item._embedded?.['wp:featuredmedia']?.find(
		(m) => m.id === item.featured_media && m.media_type === 'image',
	)
	if (media) {
		featuredImage = media.media_details?.sizes?.['medium_large']?.source_url ?? media.source_url
	}

	return {
		authors: [author],
		categories,
		content: item.content.rendered,
		datePublished: toIsoString(item.date_gmt),
		excerpt: fastGetTrimmedText(item.excerpt.rendered),
		featuredImage,
		link: item.link,
		title: fastGetTrimmedText(item.title.rendered),
	}
}

/// The outer shape stays strict: a response that isn't an array at all means
/// the source is wrong, and that should throw. Each element is then parsed
/// on its own, so one post WordPress can't fully describe doesn't blank the
/// rest of the feed the way an all-or-nothing `z.array(...).parse()` would.
export function parseWpV2Posts(body: unknown): StoryType[] {
	let items = z.array(z.unknown()).parse(body)

	return items.flatMap((raw) => {
		try {
			return [toStory(WpV2PostSchema.parse(raw))]
		} catch {
			return []
		}
	})
}
