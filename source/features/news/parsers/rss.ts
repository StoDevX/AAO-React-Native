import {
	Element,
	fastGetTrimmedText,
	getElementsByTagName,
	parseXml,
	textContent,
} from '@frogpond/html-lib'
import {z} from 'zod'
import {EXCERPT_LENGTH, truncate} from '../lib/util'
import {StoryType} from '../types'

function firstText(item: Element, tagName: string): string | undefined {
	let [el] = getElementsByTagName(tagName, item)
	let text = el ? textContent(el).trim() : ''
	return text || undefined
}

function allText(item: Element, tagName: string): string[] {
	return getElementsByTagName(tagName, item).flatMap((el) => {
		let text = textContent(el).trim()
		return text ? [text] : []
	})
}

/// The server this was ported from (ccc-server's `source/feeds/rss.ts`) reads
/// `item.getAttribute('content:encoded')` — `content:encoded` is a child
/// element, not an attribute, so that call always returned `null` and every
/// item silently fell back to the description. Full post content has never
/// actually been used there; `content` and `excerpt` end up identical. This
/// port reads the child element instead, which is a deliberate behaviour
/// change from the server.
function toStory(item: Element): StoryType {
	let authors = allText(item, 'dc:creator')
	if (authors.length === 0) authors = ['Unknown Author']

	let categories = allText(item, 'category')

	let link = firstText(item, 'link')

	let title = firstText(item, 'title')
	title = title ? fastGetTrimmedText(title) : ''
	title = title || '(no title)'

	let pubDateText = firstText(item, 'pubDate')
	let datePublished: string | undefined
	if (pubDateText) {
		// An unparseable `pubDate` throws here (via `toISOString`), which
		// drops the item in `parseRssFeed`'s per-item catch -- the same
		// malformed-date handling `parseWpV2Posts` relies on for `date_gmt`.
		datePublished = new Date(pubDateText).toISOString()
	}

	let descriptionText = firstText(item, 'description')
	let excerptFromDescription = descriptionText ? fastGetTrimmedText(descriptionText) : ''

	let encodedText = firstText(item, 'content:encoded')
	let content = encodedText
		? fastGetTrimmedText(encodedText)
		: descriptionText
			? fastGetTrimmedText(descriptionText)
			: '(no content)'

	// Mirrors the Atom parser's own excerpt fallback: a feed with no
	// `<description>` (full text delivered only via `content:encoded`, say)
	// still gets a non-empty excerpt, truncated from `content`, rather than a
	// blank one -- otherwise an RSS feed configured this way renders a news
	// list with blank excerpt rows while the equivalent Atom feed does not.
	let excerpt = excerptFromDescription || truncate(content, EXCERPT_LENGTH)

	let featuredImage: string | undefined
	let [enclosure] = getElementsByTagName('enclosure', item)
	if (enclosure && (enclosure.attribs.type ?? '').startsWith('image/')) {
		featuredImage = enclosure.attribs.url || undefined
	}

	return {
		authors,
		categories,
		content,
		datePublished,
		excerpt,
		featuredImage,
		link,
		title,
	}
}

/// The outer shape stays strict: a body that isn't a string at all means the
/// source is wrong, and that should throw. Each `<item>` is then converted on
/// its own, so one item this feed can't fully describe (an unparseable
/// `pubDate`, for instance) doesn't blank the rest of the feed.
///
/// But a non-empty feed that drops down to zero stories means the feed's
/// shape changed out from under us, not that one item was malformed -- that
/// must throw rather than render a silently blank feed. A feed with no
/// `<item>` elements is a legitimate "no stories" and stays empty.
export function parseRssFeed(body: unknown): StoryType[] {
	let xml = z.string().parse(body)
	let doc = parseXml(xml)
	let items = getElementsByTagName('item', doc)

	let stories = items.flatMap((item) => {
		try {
			return [toStory(item)]
		} catch {
			return []
		}
	})

	if (items.length > 0 && stories.length === 0) {
		throw new Error('every RSS item was malformed')
	}

	return stories
}
