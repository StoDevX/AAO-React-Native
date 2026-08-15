import {fastGetTrimmedText} from '@frogpond/html-lib'
import {z} from 'zod'
import {StoryType} from '../types'

const WpV2PostSchema = z.object({
	_embedded: z
		.object({
			// WordPress embeds an error object (no `id`) instead of an author
			// when the id doesn't resolve to a public user, so both fields are
			// optional rather than required-but-unknown.
			author: z
				.array(z.object({id: z.unknown().optional(), name: z.string().optional()}))
				.optional(),
			'wp:featuredmedia': z
				.array(
					z.object({
						id: z.unknown(),
						media_type: z.string(),
						media_details: z.object({
							sizes: z.record(z.string(), z.object({source_url: z.string()})).optional(),
						}),
						source_url: z.string(),
					}),
				)
				.nullable()
				.optional(),
			'wp:term': z.array(z.array(z.object({taxonomy: z.string(), name: z.string()}))).optional(),
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

const WpV2PostsSchema = z.array(WpV2PostSchema)

/// WordPress reports `date_gmt` as UTC but omits the marker, so an unadorned
/// value would be read as local time and shift by the offset.
function toIsoString(dateGmt: string): string {
	let stamped = dateGmt.endsWith('Z') || dateGmt.includes('+') ? dateGmt : `${dateGmt}Z`
	return new Date(stamped).toISOString()
}

export function parseWpV2Posts(body: unknown): StoryType[] {
	return WpV2PostsSchema.parse(body).map((item) => {
		let categories =
			item._embedded?.['wp:term']?.flatMap((group) =>
				group.flatMap((term) => (term.taxonomy === 'category' ? [term.name] : [])),
			) ?? []

		let author = item._embedded?.author?.find((a) => a.id === item.author)?.name ?? 'Unknown Author'

		let featuredImage: string | undefined
		let media = item._embedded?.['wp:featuredmedia']?.find(
			(m) => m.id === item.featured_media && m.media_type === 'image',
		)
		if (media) {
			featuredImage = media.media_details.sizes?.['medium_large']?.source_url ?? media.source_url
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
	})
}
