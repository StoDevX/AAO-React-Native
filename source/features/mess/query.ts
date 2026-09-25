import {fetchManifest, fetchSourceBody, REL_NEWS, resolveSource} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseMessCategories, parseMessPosts} from './lib/posts'
import {latestProfile, parseStaffProfiles} from './lib/profiles'
import type {MessStory, StaffProfile} from './types'

const WP_V2_POSTS = 'application/vnd.wordpress.v2.posts+json'
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000

export const messKeys = {
	feed: ['mess', 'feed'] as const,
	profile: (staffId: number) => ['mess', 'profile', staffId] as const,
}

/** The site root a WordPress REST URL belongs to, such as `https://olafmessenger.com`. */
function originOf(href: string): string {
	return new URL(href).origin
}

/** The Mess's feed href. Accepting only WordPress sends an older manifest's feed-items entry to the bundled one. */
async function feedHref(): Promise<string> {
	let manifest = await fetchManifest(queryClient)
	return resolveSource(manifest, REL_NEWS, 'mess', [WP_V2_POSTS]).href
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
		// Assumes the resolved feed href is an absolute WordPress URL.
		let categoriesHref = `${originOf(href)}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,parent`
		// A failed categories fetch fails the feed on purpose: sections come from it.
		let [postsBody, categoriesBody] = await Promise.all([
			fetchSourceBody(href, signal, 'Olaf Messenger'),
			fetchSourceBody(categoriesHref, signal, 'Olaf Messenger categories'),
		])
		return parseMessPosts(postsBody, parseMessCategories(categoriesBody))
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
