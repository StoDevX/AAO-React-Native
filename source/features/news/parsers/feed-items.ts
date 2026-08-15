import {z} from 'zod'
import {StoryType} from '../types'

/// ccc-server emits our normalised shape already, so this is a shape check
/// rather than a transform. It still validates: the server is as capable of
/// serving a bad payload as any other host, and every other parser here
/// validates.
const FeedItemSchema = z.object({
	authors: z.array(z.string()),
	categories: z.array(z.string()),
	content: z.string(),
	datePublished: z.string().nullable().optional(),
	excerpt: z.string().nullable(),
	featuredImage: z.string().nullable().optional(),
	link: z.string().nullable().optional(),
	title: z.string(),
})

const FeedItemsSchema = z.array(FeedItemSchema)

export function parseFeedItems(body: unknown): StoryType[] {
	return FeedItemsSchema.parse(body).map((item) => ({
		authors: item.authors,
		categories: item.categories,
		content: item.content,
		datePublished: item.datePublished ?? undefined,
		excerpt: item.excerpt ?? '',
		featuredImage: item.featuredImage ?? undefined,
		link: item.link ?? undefined,
		title: item.title,
	}))
}
