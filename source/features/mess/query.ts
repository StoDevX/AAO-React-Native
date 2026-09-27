import {
	fetchManifest,
	fetchSourceBody,
	REL_NEWS,
	resolveSource,
	SourceFetchError,
} from '@frogpond/data-sources'
import {infiniteQueryOptions, queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseMessCategories, parseMessPosts} from './lib/posts'
import {bodyParagraphs} from './lib/issue-grid'
import {ISSUE_PAGE_SIZE, parseLightPosts, parseMediaUrls, withPhotoUrls} from './lib/issues'
import {latestProfile, parseStaffProfiles} from './lib/profiles'
import {seriesKey, seriesName} from './lib/series'
import {findSpotifyRef} from './lib/spotify'
import {messKeys} from './lib/keys'
import type {LightPost, MessCategory, MessIssue, MessStory, SpotifyRef, StaffProfile} from './types'

const WP_V2_POSTS = 'application/vnd.wordpress.v2.posts+json'
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000

/** Other stories to read after one, under a heading such as `More Mouse Friends`. */
export type MessSeries = {title: string; stories: MessStory[]}

/** The site root a WordPress REST URL belongs to, such as `https://olafmessenger.com`. */
function originOf(href: string): string {
	return new URL(href).origin
}

/** The Mess's feed href. Accepting only WordPress sends an older manifest's feed-items entry to the bundled one. */
async function feedHref(): Promise<string> {
	let manifest = await fetchManifest(queryClient)
	return resolveSource(manifest, REL_NEWS, 'mess', [WP_V2_POSTS]).href
}

/** The Mess's category tree, which every query shares to work out sections and columns. */
export const messCategoriesOptions = queryOptions({
	queryKey: messKeys.categories,
	// The paper adds a category a few times a year.
	staleTime: ONE_DAY_IN_MS,
	queryFn: async ({signal}): Promise<MessCategory[]> => {
		// Assumes the resolved feed href is an absolute WordPress URL.
		let origin = originOf(await feedHref())
		let body = await fetchSourceBody(
			`${origin}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,parent`,
			signal,
			'Olaf Messenger categories',
		)
		return parseMessCategories(body)
	},
})

/** Stories from a WordPress posts path on the Mess's site, parsed like the feed. */
async function storiesAt(path: string, signal: AbortSignal, label: string): Promise<MessStory[]> {
	// Assumes the resolved feed href is an absolute WordPress URL.
	let origin = originOf(await feedHref())
	// A failed categories fetch fails the stories on purpose: sections come from it.
	let [body, categories] = await Promise.all([
		fetchSourceBody(`${origin}/wp-json/wp/v2/${path}`, signal, label),
		queryClient.query(messCategoriesOptions),
	])
	// A single post comes back as an object rather than a list.
	return parseMessPosts(Array.isArray(body) ? body : [body], categories)
}

/** The feed's stories, with sections worked out from the category tree. */
async function feedStories(signal: AbortSignal): Promise<MessStory[]> {
	let href = await feedHref()
	// A failed categories fetch fails the feed on purpose: sections come from it.
	let [postsBody, categories] = await Promise.all([
		fetchSourceBody(href, signal, 'Olaf Messenger'),
		queryClient.query(messCategoriesOptions),
	])
	return parseMessPosts(postsBody, categories)
}

/** A category's 30 newest stories. */
function categoryStories(categoryId: number, signal: AbortSignal): Promise<MessStory[]> {
	return storiesAt(
		`posts?categories=${categoryId}&per_page=30&_embed=true`,
		signal,
		'Olaf Messenger section',
	)
}

/** The Mess's newest stories, with sections worked out from its category tree. */
export const messFeedOptions = queryOptions({
	queryKey: messKeys.feed,
	// The reader shares this query, so without a stale time every story opened would fetch the
	// whole feed again. Five minutes spans a sitting of reading; the paper publishes a few times a
	// week, and pull-to-refresh fetches regardless, since refetch ignores stale time.
	staleTime: FIVE_MINUTES_IN_MS,
	queryFn: ({signal}) => feedStories(signal),
})

/** A post that came back but holds no story the reader can show. */
export class MissingMessStoryError extends Error {
	constructor(id: number) {
		super(`no Mess story ${id}`)
		this.name = 'MissingMessStoryError'
	}
}

/** One story, by its WordPress post id. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const messStoryOptions = (id: number) =>
	queryOptions({
		queryKey: messKeys.story(id),
		staleTime: FIVE_MINUTES_IN_MS,
		// A post that holds no story will hold none on a second try either.
		retry: (failureCount, error) => !(error instanceof MissingMessStoryError) && failureCount < 3,
		queryFn: async ({signal}): Promise<MessStory> => {
			let [story] = await storiesAt(`posts/${id}?_embed=true`, signal, 'Olaf Messenger story')
			if (!story) throw new MissingMessStoryError(id)
			return story
		},
	})

/**
 * A story's words alone, for the columns under a grid tile's fold: its body and nothing else,
 * a few kilobytes. Fetched again each launch rather than saved, since every photo-less tile a
 * reader scrolls past would otherwise add one to the saved cache.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const messLeadTextOptions = (id: number) =>
	queryOptions({
		queryKey: messKeys.leadText(id),
		// A story's words rarely change once it runs.
		staleTime: ONE_DAY_IN_MS,
		meta: {persist: false},
		queryFn: async ({signal}): Promise<string[]> => {
			// Assumes the resolved feed href is an absolute WordPress URL.
			let origin = originOf(await feedHref())
			let body = await fetchSourceBody(
				`${origin}/wp-json/wp/v2/posts/${id}?_fields=content`,
				signal,
				'Olaf Messenger story text',
			)
			return bodyParagraphs(body)
		},
	})

/** A category's newest stories, such as every Variety column's. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const messCategoryOptions = (categoryId: number) =>
	queryOptions({
		queryKey: messKeys.category(categoryId),
		staleTime: FIVE_MINUTES_IN_MS,
		queryFn: ({signal}) => categoryStories(categoryId, signal),
	})
/**
 * Every post the paper has published, newest first, a page at a time and in only the fields an
 * issue needs, for grouping into issues, with the page's photo addresses looked up in one more
 * request. A short page is the last.
 */
export const messIssuesOptions = infiniteQueryOptions({
	queryKey: messKeys.issues,
	// As the feed: a sitting of reading, while pull to refresh fetches regardless.
	staleTime: FIVE_MINUTES_IN_MS,
	// Top needs only the first page at launch; the rest load again as Issues scrolls to them.
	meta: {persistPages: 1},
	initialPageParam: 1,
	queryFn: async ({pageParam, signal}): Promise<LightPost[]> => {
		// Assumes the resolved feed href is an absolute WordPress URL.
		let origin = originOf(await feedHref())
		// A failed categories fetch fails the page on purpose: sections come from it.
		let [body, categories] = await Promise.all([
			fetchSourceBody(
				`${origin}/wp-json/wp/v2/posts?per_page=${ISSUE_PAGE_SIZE}&page=${pageParam}&_fields=id,date,title,categories,featured_media`,
				signal,
				'Olaf Messenger issues',
			).catch((error: unknown) => {
				// WordPress answers 400 for a page past the last, which is asked for when the post count
				// is a multiple of the page size and the last page is full: there is nothing more.
				if (pageParam > 1 && error instanceof SourceFetchError && error.status === 400) return []
				throw error
			}),
			queryClient.query(messCategoriesOptions),
		])
		let posts = parseLightPosts(body, categories)
		let photoIds = [...new Set(posts.flatMap((post) => (post.photo === null ? [] : [post.photo])))]
		if (photoIds.length === 0) return posts
		// A row without its photo draws a tinted square, so a failed lookup leaves the page whole.
		let urls = await fetchSourceBody(
			`${origin}/wp-json/wp/v2/media?include=${photoIds.join(',')}&per_page=${ISSUE_PAGE_SIZE}&_fields=id,source_url`,
			signal,
			'Olaf Messenger photos',
		)
			.then(parseMediaUrls)
			.catch(() => new Map<number, string>())
		return withPhotoUrls(posts, urls)
	},
	getNextPageParam: (lastPage, _allPages, lastPageParam) =>
		lastPage.length < ISSUE_PAGE_SIZE ? undefined : lastPageParam + 1,
})

/**
 * One issue's stories, asked for by their ids and parsed like the feed. Only the newest issue's,
 * the front page's top tile, are saved for the next launch; any other is fetched again when opened.
 */
/* oxlint-disable typescript/explicit-module-boundary-types -- queryOptions' own return type */
export const messIssueOptions = (
	issue: Pick<MessIssue, 'key' | 'storyIds'>,
	{persist = false}: {persist?: boolean} = {},
) =>
	queryOptions<MessStory[]>({
		queryKey: messKeys.issue(issue),
		meta: {persist},
		// A published issue rarely changes.
		staleTime: ONE_DAY_IN_MS,
		// A story joining or leaving the issue changes its key; the stories already on screen stay
		// while the new set loads. Another issue's stories never stand in.
		placeholderData: (previous, previousQuery) =>
			previousQuery?.queryKey[2] === issue.key ? previous : undefined,
		// By id rather than by date: a week's range can take in a special edition, which is an issue
		// of its own. WordPress answers at most a page of ids at once, and an issue that runs over a
		// quiet summer can hold more, so they are asked for a page at a time.
		queryFn: async ({signal}) => {
			let batches = []
			for (let i = 0; i < issue.storyIds.length; i += ISSUE_PAGE_SIZE) {
				batches.push(issue.storyIds.slice(i, i + ISSUE_PAGE_SIZE))
			}
			let stories = await Promise.all(
				batches.map((ids) =>
					storiesAt(
						`posts?include=${ids.join(',')}&per_page=${ISSUE_PAGE_SIZE}&_embed=true`,
						signal,
						'Olaf Messenger issue',
					),
				),
			)
			return stories.flat()
		},
	})
/* oxlint-enable typescript/explicit-module-boundary-types */

/**
 * What to read after a story: the other episodes of its series, such as a comic's, or failing
 * that its writer's other work in the same column. Never includes the story itself.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const messSeriesOptions = (story: MessStory) =>
	// oxlint-disable-next-line @tanstack/query/exhaustive-deps -- the title, column and bylines all follow from the id
	queryOptions({
		queryKey: messKeys.series(story.id),
		staleTime: ONE_DAY_IN_MS,
		queryFn: async ({signal}): Promise<MessSeries> => {
			let categories = await queryClient.query(messCategoriesOptions)
			let column = categories.find((c) => c.name === story.column)
			if (!column) return {title: '', stories: []}

			let name = seriesName(story.title)
			if (name) {
				let key = name.toLowerCase()
				// The column's list, cached under the same key the Mess list uses for it.
				let recent = await queryClient.query(messCategoryOptions(column.id))
				let episodes = recent.filter((s) => s.id !== story.id && seriesKey(s.title) === key)
				// The newest episode spells the series as the paper now does, which an older title may not.
				let newest = episodes[0]
				if (newest) {
					return {title: `More ${seriesName(newest.title) ?? name}`, stories: episodes.slice(0, 6)}
				}
			}

			let writer = story.bylines[0]
			if (!writer) return {title: '', stories: []}
			// Seven, so that six remain once the story itself is dropped.
			let byWriter = await storiesAt(
				`posts?categories=${column.id}&staff_name=${writer.id}&per_page=7&_embed=true`,
				signal,
				'Olaf Messenger writer',
			)
			return {
				title: `More by ${writer.name}`,
				stories: byWriter.filter((s) => s.id !== story.id).slice(0, 6),
			}
		},
	})

/**
 * The Spotify playlist on a Playlist post's web page, for a post whose body names none: the
 * site's theme draws those players from a field the REST API does not return. Null when the
 * page names none either.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const messPlaylistPageOptions = (story: MessStory) =>
	// oxlint-disable-next-line @tanstack/query/exhaustive-deps -- the link follows from the id
	queryOptions({
		queryKey: messKeys.playlistPage(story.id),
		// A published post's playlist does not change.
		staleTime: ONE_DAY_IN_MS,
		// The page shows a placeholder until this settles, so it fails at once offline, and
		// after one retry otherwise, letting the page fall back; it is fetched again when the
		// network returns.
		networkMode: 'always',
		retry: 1,
		queryFn: async ({signal}): Promise<SpotifyRef | null> => {
			let page = await fetchSourceBody(story.link, signal, 'Olaf Messenger page', 'text')
			return typeof page === 'string' ? findSpotifyRef(page) : null
		},
	})

/** One writer's newest staff profile, or null when they have none. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const staffProfileOptions = (staffId: number) =>
	queryOptions({
		queryKey: messKeys.profile(staffId),
		staleTime: ONE_DAY_IN_MS,
		queryFn: async ({signal}): Promise<StaffProfile | null> => {
			// Assumes the resolved feed href is an absolute WordPress URL.
			let origin = originOf(await feedHref())
			let body = await fetchSourceBody(
				`${origin}/wp-json/wp/v2/staff_profile?staff_name=${staffId}&_embed=true`,
				signal,
				'Olaf Messenger staff profile',
			)
			return latestProfile(parseStaffProfiles(body))
		},
	})
