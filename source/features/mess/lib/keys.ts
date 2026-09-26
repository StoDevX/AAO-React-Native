import type {MessIssue} from '../types'

/** The prefix of every issue's key. */
const ANY_ISSUE = ['mess', 'issue'] as const

/**
 * The Mess's React Query keys. They live apart from the queries so that the persisted cache's
 * filter can read them without loading the queries, which need the app's query client.
 */
export const messKeys = {
	all: ['mess'] as const,
	feed: ['mess', 'feed'] as const,
	profile: (staffId: number) => ['mess', 'profile', staffId] as const,
	categories: ['mess', 'categories'] as const,
	story: (id: number) => ['mess', 'story', id] as const,
	category: (categoryId: number) => ['mess', 'category', categoryId] as const,
	series: (storyId: number) => ['mess', 'series', storyId] as const,
	playlistPage: (storyId: number) => ['mess', 'playlist-page', storyId] as const,
	issues: ['mess', 'issues'] as const,
	anyIssue: ANY_ISSUE,
	/**
	 * One issue's stories, by the range WordPress fetches them with and how many the issue list
	 * counts, so a story added to the newest issue, whose range has no end, fetches it again
	 */
	issue: (issue: Pick<MessIssue, 'after' | 'before' | 'count'>) =>
		[...ANY_ISSUE, issue.after, issue.before, issue.count] as const,
}
