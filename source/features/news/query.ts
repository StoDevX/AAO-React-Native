import {fetchManifest, REL_NEWS, resolveSource} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseFeedItems} from './parsers/feed-items'
import {parseWpV2Posts} from './parsers/wp-v2-posts'
import {StoryType} from './types'

const WP_V2_POSTS = 'application/vnd.wordpress.v2.posts+json'
const FEED_ITEMS = 'application/vnd.frogpond.feed-items+json'

export const NEWS_TYPES = [WP_V2_POSTS, FEED_ITEMS] as const

export const keys = {
	named: (name: string) => ['news', 'named', name] as const,
}

function parse(type: string, body: unknown): StoryType[] {
	switch (type) {
		case WP_V2_POSTS:
			return parseWpV2Posts(body)
		case FEED_ITEMS:
			return parseFeedItems(body)
		default:
			throw new Error(`no news parser for "${type}"`)
	}
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const namedNewsOptions = (source: string) =>
	queryOptions({
		queryKey: keys.named(source),
		queryFn: async ({queryKey, signal}): Promise<StoryType[]> => {
			let manifest = await fetchManifest(queryClient)
			let resolved = resolveSource(manifest, REL_NEWS, queryKey[2], NEWS_TYPES)

			let response = await fetch(resolved.href, {signal})
			if (!response.ok) {
				throw new Error(`News fetch failed: ${response.status}`)
			}

			return parse(resolved.type, await response.json())
		},
	})
