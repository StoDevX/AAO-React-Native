import type {StoryType} from '../../news/types'
import type {MessStory} from '../types'

/**
 * A Mess story as the generic news row reads it. Its only category is its
 * section, so the news picker offers sections rather than raw WordPress
 * categories such as `Featured`.
 */
export function asStory(story: MessStory): StoryType {
	return {
		title: story.title,
		excerpt: story.excerpt,
		content: '',
		authors: story.bylines.map((b) => b.name),
		categories: story.section ? [story.section] : [],
		datePublished: story.published,
		featuredImage: story.photo?.url,
		link: story.link,
	}
}
