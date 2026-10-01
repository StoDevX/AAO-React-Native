import {escapeMarkdownHref, escapeMarkdownText} from '../../../lib/markdown-escape'
import type {LabelLink} from '../types'

/**
 * The card's Sources line as markdown, each source a link to its page; null
 * when there is nothing to cite. A citation without an href or a label is
 * dropped: the feed is not validated at the boundary, and a link to nowhere, or
 * one with nothing to tap, helps no one.
 */
export function citationLine(citations: Array<LabelLink> | null | undefined): string | null {
	let sources = (citations ?? []).filter((citation) => citation?.href && citation.label)
	if (sources.length === 0) {
		return null
	}
	let links = sources.map(
		({label, href}) => `[${escapeMarkdownText(label)}](${escapeMarkdownHref(href)})`,
	)
	return `${sources.length === 1 ? 'Source' : 'Sources'}: ${links.join(' · ')}`
}
