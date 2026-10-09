import type {Paper} from '../campus-section'
import type {MessIssue} from '../types'

/**
 * A paper's React Query keys, each under the paper's id. They live apart from the queries so
 * that the persisted cache's filter can read them without loading the queries, which need the
 * app's query client.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types -- the keys' own literal types
export function paperKeys(id: Paper['id']) {
	/** The prefix of every issue's key. */
	const anyIssue = [id, 'issue'] as const
	return {
		all: [id] as const,
		feed: [id, 'feed'] as const,
		profile: (staffId: number) => [id, 'profile', staffId] as const,
		categories: [id, 'categories'] as const,
		story: (storyId: number) => [id, 'story', storyId] as const,
		/** A story's words alone, for a grid tile with no photo */
		leadText: (storyId: number) => [id, 'lead-text', storyId] as const,
		category: (categoryId: number) => [id, 'category', categoryId] as const,
		series: (storyId: number) => [id, 'series', storyId] as const,
		playlistPage: (storyId: number) => [id, 'playlist-page', storyId] as const,
		/** A gallery's photos, by the media ids its slideshow names */
		gallery: (photoIds: number[]) => [id, 'gallery', photoIds] as const,
		/** The newest staff year's profiles, for the staff directory */
		staff: [id, 'staff'] as const,
		/** The paper's Contact page, as sections of contacts and prose */
		about: [id, 'about'] as const,
		issues: [id, 'issues'] as const,
		anyIssue,
		/**
		 * One issue's stories, by the issue's name and the ids it is fetched by, so a story joining
		 * or leaving the issue fetches it again
		 */
		issue: (issue: Pick<MessIssue, 'key' | 'storyIds'>) =>
			[...anyIssue, issue.key, issue.storyIds] as const,
	}
}

/** The Mess's React Query keys. */
export const messKeys = paperKeys('mess')
