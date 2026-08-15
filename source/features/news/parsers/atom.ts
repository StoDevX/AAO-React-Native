import {
	Element,
	fastGetTrimmedText,
	getElementsByTagName,
	parseXml,
	textContent,
} from '@frogpond/html-lib'
import {z} from 'zod'
import {StoryType} from '../types'

const EXCERPT_LENGTH = 200

function firstElement(entry: Element, tagName: string): Element | undefined {
	let [el] = getElementsByTagName(tagName, entry)
	return el
}

function firstText(entry: Element, tagName: string): string | undefined {
	let el = firstElement(entry, tagName)
	let text = el ? textContent(el).trim() : ''
	return text || undefined
}

/// RFC 4287: a `<link>` with no `rel` attribute defaults to `rel="alternate"`.
/// Only that link (or an explicit `rel="alternate"`) is the entry's canonical
/// URL -- `rel="self"` (the feed's own address) and `rel="enclosure"`
/// (attached media) are not, and must not be mistaken for it.
function alternateLink(entry: Element): string | undefined {
	let links = getElementsByTagName('link', entry)
	let link = links.find((el) => {
		let rel = el.attribs.rel
		return rel === undefined || rel === 'alternate'
	})
	return link?.attribs.href || undefined
}

function imageEnclosureLink(entry: Element): string | undefined {
	let links = getElementsByTagName('link', entry)
	let link = links.find(
		(el) => el.attribs.rel === 'enclosure' && (el.attribs.type ?? '').startsWith('image/'),
	)
	return link?.attribs.href || undefined
}

function truncate(text: string, length: number): string {
	if (text.length <= length) return text
	return text.slice(0, length).trimEnd() + '…'
}

/// `<title>`, `<summary>` and `<content>` may carry `type="html"`,
/// `"text"` or `"xhtml"`. `fastGetTrimmedText` strips tags and decodes
/// entities either way, so html and text are handled alike without needing
/// to branch on the attribute. `xhtml` wraps its body in a nested
/// `<div xmlns="...">`; `textContent` flattens all of that div's descendant
/// text nodes regardless of block structure, which loses paragraph breaks
/// but does not produce garbage -- that loss is intentionally unhandled.
function toStory(entry: Element): StoryType {
	let authorEls = getElementsByTagName('author', entry)
	let authors = authorEls.flatMap((author) => {
		let name = firstText(author, 'name')
		return name ? [name] : []
	})
	if (authors.length === 0) authors = ['Unknown Author']

	let categories = getElementsByTagName('category', entry).flatMap((el) => {
		let term = el.attribs.term
		return term ? [term] : []
	})

	let link = alternateLink(entry)

	let titleText = firstText(entry, 'title')
	let title = titleText ? fastGetTrimmedText(titleText) : ''
	title = title || '(no title)'

	let dateText = firstText(entry, 'published') ?? firstText(entry, 'updated')
	let datePublished: string | undefined
	if (dateText) {
		// An unparseable date throws here (via `toISOString`), which drops the
		// entry in `parseAtomFeed`'s per-entry catch -- the same malformed-date
		// handling `parseRssFeed` relies on for `pubDate`.
		datePublished = new Date(dateText).toISOString()
	}

	let summaryText = firstText(entry, 'summary')
	let excerptFromSummary = summaryText ? fastGetTrimmedText(summaryText) : ''

	let contentEl = firstElement(entry, 'content')
	let inlineContentText: string | undefined
	if (contentEl && !contentEl.attribs.src) {
		// A `src` attribute means the content lives at an external URL -- there
		// is no inline text to read, only a pointer to fetch separately, which
		// this parser does not do.
		let raw = textContent(contentEl).trim()
		inlineContentText = raw ? fastGetTrimmedText(raw) : undefined
	}

	let content = inlineContentText || excerptFromSummary || '(no content)'
	let excerpt = excerptFromSummary || truncate(content, EXCERPT_LENGTH)

	let featuredImage = imageEnclosureLink(entry)

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
/// source is wrong, and that should throw. Each `<entry>` is then converted
/// on its own, so one entry this feed can't fully describe (an unparseable
/// `published`/`updated`, for instance) doesn't blank the rest of the feed.
///
/// But a non-empty feed that drops down to zero stories means the feed's
/// shape changed out from under us, not that one entry was malformed -- that
/// must throw rather than render a silently blank feed. A feed with no
/// `<entry>` elements is a legitimate "no stories" and stays empty.
export function parseAtomFeed(body: unknown): StoryType[] {
	let xml = z.string().parse(body)
	let doc = parseXml(xml)
	let entries = getElementsByTagName('entry', doc)

	let stories = entries.flatMap((entry) => {
		try {
			return [toStory(entry)]
		} catch {
			return []
		}
	})

	if (entries.length > 0 && stories.length === 0) {
		throw new Error('every Atom entry was malformed')
	}

	return stories
}
