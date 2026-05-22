import type {
	CrosspostParent,
	PollData,
	RedditCommentType,
	RedditPostType,
} from './types'

const USER_AGENT = 'AAO-React-Native/1.0 (by /u/StoDevX)'

// ── Raw Reddit JSON shapes ─────────────────────────────────────────────────

interface RawRedditPost {
	id: string
	title: string
	author: string
	created_utc: number
	permalink: string
	selftext_html: string | null
	thumbnail: string | null
	post_hint?: string
	is_gallery?: boolean
	is_self: boolean
	crosspost_parent?: string
	crosspost_parent_list?: Array<{
		id: string
		title: string
		author: string
		subreddit: string
		selftext: string
		permalink: string
		created_utc: number
		is_self: boolean
		is_gallery?: boolean
		thumbnail: string | null
	}>
	media_metadata?: Record<
		string,
		{
			status: string
			e: string
			s?: {u?: string; x?: number; y?: number}
		}
	>
	url_overridden_by_dest?: string
	domain?: string
	poll_data?: {
		options: Array<{text: string; total_vote_count?: number}>
		total_vote_count: number
		voting_end_timestamp?: number
	}
}

interface RawRedditListing {
	data: {children: Array<{kind: string; data: RawRedditPost}>}
}

interface RawCommentChild {
	kind: string
	data: {
		id: string
		author: string
		body_html: string
		created_utc: number
		score: number | null
		replies: '' | {kind: string; data: {children: RawCommentChild[]}}
	}
}

// ── Helpers ────────────────────────────────────────────────────────────────

const REDDIT_SPECIAL_THUMBNAILS = new Set([
	'self',
	'default',
	'nsfw',
	'spoiler',
	'image',
	'',
])

function normalizeThumbnail(raw: string | null | undefined): string | null {
	if (!raw || REDDIT_SPECIAL_THUMBNAILS.has(raw)) return null
	try {
		new URL(raw)
		return raw
	} catch {
		return null
	}
}

function detectPostType(
	d: RawRedditPost,
): 'text' | 'image' | 'gallery' | 'link' | 'crosspost' | 'poll' {
	if (d.poll_data) return 'poll'
	if (d.crosspost_parent) return 'crosspost'
	if (d.is_gallery) return 'gallery'
	if (d.post_hint === 'image') return 'image'
	if (d.post_hint === 'link') return 'link'
	// Fallback: non-self posts with an external URL are link posts even when
	// post_hint is absent (e.g. posts to news sites that omit the hint field)
	if (!d.is_self && d.url_overridden_by_dest) return 'link'
	return 'text'
}

const HTML_ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#039;': "'",
}

function decodeHtmlEntities(str: string): string {
	return str.replace(
		/&(?:amp|lt|gt|quot|#039);/gu,
		(entity) => HTML_ENTITIES[entity] ?? entity,
	)
}

function extractGalleryImages(
	metadata: RawRedditPost['media_metadata'],
): string[] {
	if (!metadata) return []
	return Object.values(metadata)
		.filter(
			(item) => item.status === 'valid' && item.e === 'Image' && item.s?.u,
		)
		.map((item) => decodeHtmlEntities(item.s?.u ?? ''))
		.filter((url) => url.length > 0)
}

// ── Post parser ────────────────────────────────────────────────────────────

function parsePost(kind: string, d: RawRedditPost): RedditPostType | null {
	if (kind !== 't3') return null

	const postType = detectPostType(d)
	const thumbnail = normalizeThumbnail(d.thumbnail)

	const rawCrosspost = d.crosspost_parent_list?.[0]
	const crosspostParent: CrosspostParent | null =
		rawCrosspost && postType === 'crosspost'
			? {
					title: rawCrosspost.title,
					subreddit: rawCrosspost.subreddit ?? '',
					author: rawCrosspost.author,
					selftext: rawCrosspost.selftext ?? '',
					permalink: `https://www.reddit.com${rawCrosspost.permalink}`,
				}
			: null

	const images =
		postType === 'gallery' ? extractGalleryImages(d.media_metadata) : []

	const externalUrl = d.url_overridden_by_dest ?? null
	const imageUrl = postType === 'image' ? externalUrl : null
	const linkUrl = postType === 'link' ? externalUrl : null
	const linkDomain =
		postType === 'link' && d.domain && !d.domain.startsWith('self.')
			? d.domain
			: null

	const pollData: PollData | null = d.poll_data
		? {
				options: d.poll_data.options.map((opt) => ({
					text: opt.text,
					votes: opt.total_vote_count ?? 0,
				})),
				totalVotes: d.poll_data.total_vote_count,
				votingEndAt: d.poll_data.voting_end_timestamp
					? new Date(d.poll_data.voting_end_timestamp * 1000).toISOString()
					: null,
			}
		: null

	return {
		id: `t3_${d.id}`,
		title: d.title.trim(),
		author: d.author,
		publishedAt: new Date(d.created_utc * 1000).toISOString(),
		permalink: `https://www.reddit.com${d.permalink}`,
		contentHtml: d.selftext_html ?? '',
		thumbnail,
		postType,
		imageUrl,
		images: images.length > 0 ? images : undefined,
		linkUrl,
		linkDomain,
		crosspostParent,
		pollData,
	}
}

export function parseRedditPostsJson(response: unknown): RedditPostType[] {
	const listing = response as RawRedditListing
	const children = listing?.data?.children ?? []
	return children.flatMap(({kind, data: d}) => {
		const post = parsePost(kind, d)
		return post ? [post] : []
	})
}

// ── Comment parser ─────────────────────────────────────────────────────────

function parseCommentChild(child: RawCommentChild): RedditCommentType[] {
	if (child.kind !== 't1') return []
	const d = child.data
	const repliesChildren =
		d.replies && typeof d.replies === 'object' ? d.replies.data.children : []

	return [
		{
			id: `t1_${d.id}`,
			author: d.author,
			contentHtml: d.body_html,
			publishedAt: new Date(d.created_utc * 1000).toISOString(),
			score: d.score ?? 0,
			replies: repliesChildren.flatMap(parseCommentChild),
		},
	]
}

export function parseRedditCommentsJson(
	response: unknown,
): RedditCommentType[] {
	if (!Array.isArray(response) || response.length < 2) return []
	const commentListing = response[1] as {data: {children: RawCommentChild[]}}
	return commentListing.data.children.flatMap(parseCommentChild)
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

export async function fetchRedditPosts(
	subreddit: string,
	signal?: AbortSignal,
): Promise<RedditPostType[]> {
	const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25&raw_json=1`
	const res = await fetch(url, {signal, headers: {'User-Agent': USER_AGENT}})
	if (!res.ok) throw new Error(`Reddit posts fetch failed: ${res.status}`)
	const json = await res.json()
	return parseRedditPostsJson(json)
}

export async function fetchRedditComments(
	postUrl: string,
	signal?: AbortSignal,
): Promise<RedditCommentType[]> {
	const parsed = new URL(postUrl)
	const jsonPath = parsed.pathname.replace(/\/$/u, '') + '.json'
	const url = `https://www.reddit.com${jsonPath}?raw_json=1`
	const res = await fetch(url, {signal, headers: {'User-Agent': USER_AGENT}})
	if (!res.ok) throw new Error(`Reddit comments fetch failed: ${res.status}`)
	const json = await res.json()
	return parseRedditCommentsJson(json)
}
