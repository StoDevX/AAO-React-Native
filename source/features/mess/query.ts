import {fetchManifest, fetchSourceBody, REL_NEWS, resolveSource} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseMessCategories, parseMessPosts} from './lib/posts'
import {latestProfile, parseStaffProfiles} from './lib/profiles'
import {seriesKey, seriesName} from './lib/series'
import type {MessCategory, MessStory, StaffProfile} from './types'

const WP_V2_POSTS = 'application/vnd.wordpress.v2.posts+json'
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000

export const messKeys = {
	feed: ['mess', 'feed'] as const,
	profile: (staffId: number) => ['mess', 'profile', staffId] as const,
	categories: ['mess', 'categories'] as const,
	story: (id: number) => ['mess', 'story', id] as const,
	category: (categoryId: number) => ['mess', 'category', categoryId] as const,
	series: (storyId: number) => ['mess', 'series', storyId] as const,
}

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

/** The Mess's newest stories, with sections worked out from its category tree. */
export const messFeedOptions = queryOptions({
	queryKey: messKeys.feed,
	// The reader shares this query, so without a stale time every story opened would fetch the
	// whole feed again. Five minutes spans a sitting of reading; the paper publishes a few times a
	// week, and pull-to-refresh fetches regardless, since refetch ignores stale time.
	staleTime: FIVE_MINUTES_IN_MS,
	queryFn: async ({signal}): Promise<MessStory[]> => {
		let href = await feedHref()
		// A failed categories fetch fails the feed on purpose: sections come from it.
		let [postsBody, categories] = await Promise.all([
			fetchSourceBody(href, signal, 'Olaf Messenger'),
			queryClient.query(messCategoriesOptions),
		])
		return parseMessPosts(postsBody, categories)
	},
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

/** A category's newest stories, such as every Variety column's. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const messCategoryOptions = (categoryId: number) =>
	queryOptions({
		queryKey: messKeys.category(categoryId),
		staleTime: FIVE_MINUTES_IN_MS,
		queryFn: ({signal}) =>
			storiesAt(
				`posts?categories=${categoryId}&per_page=30&_embed=true`,
				signal,
				'Olaf Messenger section',
			),
	})

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
				let recent = await storiesAt(
					`posts?categories=${column.id}&per_page=30&_embed=true`,
					signal,
					'Olaf Messenger series',
				)
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
