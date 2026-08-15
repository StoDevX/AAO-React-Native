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

function toStory(item: z.infer<typeof FeedItemSchema>): StoryType {
	return {
		authors: item.authors,
		categories: item.categories,
		content: item.content,
		datePublished: item.datePublished ?? undefined,
		excerpt: item.excerpt ?? '',
		featuredImage: item.featuredImage ?? undefined,
		link: item.link ?? undefined,
		title: item.title,
	}
}

/// The outer shape stays strict — a response that isn't an array means the
/// source is wrong. Each element is parsed on its own so one malformed item
/// doesn't blank the rest of the feed, matching `parseWpV2Posts`.
export function parseFeedItems(body: unknown): StoryType[] {
	let items = z.array(z.unknown()).parse(body)

	return items.flatMap((raw) => {
		try {
			return [toStory(FeedItemSchema.parse(raw))]
		} catch {
			return []
		}
	})
}
