import {fetchManifest, fetchSourceBody, REL_NEWS, resolveSource} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseAtomFeed} from './parsers/atom'
import {parseFeedItems} from './parsers/feed-items'
import {parseRssFeed} from './parsers/rss'
import {parseWpV2Posts} from './parsers/wp-v2-posts'
import {StoryType} from './types'

const WP_V2_POSTS = 'application/vnd.wordpress.v2.posts+json'
const FEED_ITEMS = 'application/vnd.frogpond.feed-items+json'
const RSS = 'application/rss+xml'
const ATOM = 'application/atom+xml'

interface NewsParser {
	format: 'json' | 'text'
	parse: (body: unknown) => StoryType[]
}

// One entry per media type, so its wire format and its parser can't drift
// apart the way a separate switch and ternary could.
const NEWS_PARSERS: Record<string, NewsParser> = {
	[WP_V2_POSTS]: {format: 'json', parse: parseWpV2Posts},
	[FEED_ITEMS]: {format: 'json', parse: parseFeedItems},
	[RSS]: {format: 'text', parse: parseRssFeed},
	[ATOM]: {format: 'text', parse: parseAtomFeed},
}

export const NEWS_TYPES = Object.keys(NEWS_PARSERS)

export const keys = {
	named: (name: string) => ['news', 'named', name] as const,
}

function parserFor(type: string): NewsParser {
	let parser = NEWS_PARSERS[type]
	if (!parser) throw new Error(`no news parser for "${type}"`)
	return parser
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const namedNewsOptions = (source: string) =>
	queryOptions({
		queryKey: keys.named(source),
		queryFn: async ({queryKey, signal}): Promise<StoryType[]> => {
			let manifest = await fetchManifest(queryClient)
			let resolved = resolveSource(manifest, REL_NEWS, queryKey[2], NEWS_TYPES)

			let parser = parserFor(resolved.type)
			let body = await fetchSourceBody(resolved.href, signal, 'News', parser.format)

			return parser.parse(body)
		},
	})
