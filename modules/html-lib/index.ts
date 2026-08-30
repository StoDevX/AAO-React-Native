import {parseDocument} from 'htmlparser2'
import {getElementsByTagName, textContent} from 'domutils'
import {AnyNode, Document, Element, isText, isTag, type ChildNode} from 'domhandler'
import cssSelect from 'css-select'

export {textContent, cssSelect, getElementsByTagName, isTag, isText}
export {encode, decode} from 'html-entities'
export type {AnyNode, ChildNode, Document, Element} from 'domhandler'

export function parseHtml(string: string): Document {
	return parseDocument(string, {
		xmlMode: false,
		decodeEntities: true,
	})
}

/// RSS and other XML feeds use namespaced tag names (`dc:creator`,
/// `content:encoded`) that `parseHtml`'s HTML mode does not preserve
/// faithfully, and XML has its own rules for self-closing tags and CDATA
/// sections that HTML mode does not apply. `xmlMode: true` treats those
/// names as ordinary (colon-containing) tag names rather than attempting
/// namespace resolution, so callers can find them with `getElementsByTagName`
/// without a namespace-aware selector.
export function parseXml(string: string): Document {
	return parseDocument(string, {
		xmlMode: true,
		decodeEntities: true,
	})
}

export function innerTextWithSpaces(elem: AnyNode): string {
	return textContent(elem).split(/\s+/u).join(' ').trim()
}

function collectText(nodes: ChildNode[], out: string[]): void {
	// An explicit stack rather than recursion: the markup here is uncontrolled,
	// and deeply nested input would otherwise overflow the call stack.
	const stack: ChildNode[] = nodes.slice().reverse()

	for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
		if (isText(node)) {
			out.push(node.data)
			continue
		}

		if (!isTag(node)) continue

		// `<script>` and `<style>` bodies are code, not prose; dropping them
		// keeps stylesheets and JS out of what we render as text.
		const tag = node.name.toLowerCase()
		if (tag === 'script' || tag === 'style') continue

		// Pushed in reverse so they pop back off in document order.
		const {children} = node
		for (let i = children.length - 1; i >= 0; i -= 1) {
			stack.push(children[i])
		}
	}
}

/**
 * Strips HTML tags from a string, leaving only its text content.
 *
 * Text runs separated by a tag are joined with a space, so `a<br>b` becomes
 * `a b` rather than `ab`. Character entities are decoded — callers do not need
 * to run the result through `decode`.
 */
export function removeHtml(str: string): string {
	const parts: string[] = []
	collectText(parseHtml(str).children, parts)
	return parts.join(' ')
}

export function fastGetTrimmedText(str: string): string {
	return removeHtml(str).replace(/\s+/gu, ' ').trim()
}

// ── Structured HTML-to-text utilities ─────────────────────────────────────

export type TextSegment = {type: 'text'; text: string}
export type LinkSegment = {type: 'link'; text: string; url: string}
export type Segment = TextSegment | LinkSegment

function walkNodes(nodes: ChildNode[], listContext?: 'ul' | 'ol'): string {
	let result = ''
	let olCounter = 0

	for (const node of nodes) {
		if (isText(node)) {
			if (node.data.trim() !== '') result += node.data
			continue
		}

		if (!isTag(node)) continue

		const tag = node.name.toLowerCase()
		const children = node.children

		switch (tag) {
			case 'p':
				result += walkNodes(children).trim() + '\n\n'
				break
			case 'br':
				result += '\n'
				break
			case 'ul':
				result += walkNodes(children, 'ul')
				break
			case 'ol':
				result += walkNodes(children, 'ol')
				break
			case 'li': {
				olCounter += 1
				const content = walkNodes(children).trim()
				if (listContext === 'ol') {
					result += `${olCounter}. ${content}\n`
				} else {
					result += `• ${content}\n`
				}
				break
			}
			case 'blockquote': {
				const inner = walkNodes(children).trim()
				result +=
					inner
						.split('\n')
						.map((line) => `  ${line}`)
						.join('\n') + '\n'
				break
			}
			case 'table':
			case 'thead':
			case 'tbody':
			case 'tr':
			case 'td':
			case 'th':
				break
			default:
				result += walkNodes(children)
		}
	}

	return result
}

/**
 * Converts an HTML string to plain text, preserving block-level structure.
 *
 * - `<p>` blocks are separated by double newlines.
 * - `<br>` becomes a single newline.
 * - `<ul>` / `<ol>` list items become bullet or numbered lines.
 * - `<blockquote>` content is indented by two spaces per level.
 * - Table elements (`<table>`, `<tr>`, etc.) are stripped entirely.
 * - Runs of 3+ newlines are collapsed to two; leading/trailing newlines are trimmed.
 */
export function htmlToFormattedText(html: string): string {
	const doc = parseHtml(html)
	const raw = walkNodes(doc.children)
	return raw.replace(/\n{3,}/gu, '\n\n').replace(/^\n+|\n+$/gu, '')
}

function appendText(segments: Segment[], text: string): void {
	if (!text) return
	const last = segments[segments.length - 1]
	if (last?.type === 'text') {
		last.text += text
	} else {
		segments.push({type: 'text', text})
	}
}

function mergeSegments(target: Segment[], source: Segment[]): void {
	for (const seg of source) {
		if (seg.type === 'text') {
			appendText(target, seg.text)
		} else {
			target.push(seg)
		}
	}
}

function walkSegments(nodes: ChildNode[], segments: Segment[], listContext?: 'ul' | 'ol'): void {
	let olCounter = 0

	for (const node of nodes) {
		if (isText(node)) {
			if (node.data.trim() !== '') appendText(segments, node.data)
			continue
		}
		if (!isTag(node)) continue

		const tag = node.name.toLowerCase()
		const children = node.children

		switch (tag) {
			case 'a': {
				const href = (node.attribs?.href ?? '').trim()
				const text = walkNodes(children)
				if (href) {
					segments.push({type: 'link', text, url: href})
				} else {
					appendText(segments, text)
				}
				break
			}
			case 'p': {
				const inner: Segment[] = []
				walkSegments(children, inner)
				const last = inner[inner.length - 1]
				if (last?.type === 'text') last.text = last.text.trimEnd()
				mergeSegments(segments, inner)
				appendText(segments, '\n\n')
				break
			}
			case 'br':
				appendText(segments, '\n')
				break
			case 'ul':
				walkSegments(children, segments, 'ul')
				break
			case 'ol':
				walkSegments(children, segments, 'ol')
				break
			case 'li': {
				olCounter += 1
				const inner: Segment[] = []
				walkSegments(children, inner)
				const prefix = listContext === 'ol' ? `${olCounter}. ` : '• '
				const firstSeg = inner[0]
				if (firstSeg?.type === 'text') {
					firstSeg.text = firstSeg.text.trimStart()
				}
				const lastSeg = inner[inner.length - 1]
				if (lastSeg?.type === 'text') {
					lastSeg.text = lastSeg.text.trimEnd()
				}
				appendText(segments, prefix)
				mergeSegments(segments, inner)
				appendText(segments, '\n')
				break
			}
			case 'blockquote': {
				const inner: Segment[] = []
				walkSegments(children, inner)
				const indented = inner.map((seg) => ({
					...seg,
					text: seg.text.replace(/^/gmu, '  '),
				}))
				mergeSegments(segments, indented)
				appendText(segments, '\n')
				break
			}
			case 'table':
			case 'thead':
			case 'tbody':
			case 'tr':
			case 'td':
			case 'th':
				break
			default:
				walkSegments(children, segments)
		}
	}
}

function normalizeSegments(segments: Segment[]): Segment[] {
	return segments
		.map((seg) => {
			if (seg.type !== 'text') return seg
			return {
				...seg,
				text: seg.text.replace(/\n{3,}/gu, '\n\n').replace(/^\n+|\n+$/gu, ''),
			}
		})
		.filter((seg) => seg.type !== 'text' || seg.text !== '')
}

/**
 * Converts an HTML string to an array of `Segment` objects suitable for
 * rendering mixed text and tappable links in React Native.
 *
 * - Plain text nodes become `{type: 'text', text}` segments.
 * - `<a href="…">` elements become `{type: 'link', text, url}` segments,
 *   preserving the `href` so callers can open the URL on press.
 *   Anchors without an `href` (or an empty `href`) fall back to plain text.
 * - Block structure (`<p>`, `<ul>`, `<blockquote>`, etc.) is preserved the
 *   same way as in `htmlToFormattedText`.
 * - Adjacent text segments are automatically merged; empty segments are removed.
 */
export function htmlToSegments(html: string): Segment[] {
	const doc = parseHtml(html)
	const segments: Segment[] = []
	walkSegments(doc.children, segments)
	return normalizeSegments(segments)
}

// ── HTML-to-markdown ──────────────────────────────────────────────────────

/** Markdown's inline punctuation, escaped wherever text appears so that a
 * posting reading "10*12 per hour" does not render as emphasis. */
const INLINE_PUNCTUATION = /([\\`*_[\]])/gu

function escapeInline(text: string): string {
	// A non-breaking space is a space as far as markdown is concerned, and
	// leaving it in defeats every trim downstream.
	return text.replace(/\u00a0/gu, ' ').replace(INLINE_PUNCTUATION, '\\$1')
}

/** Escapes punctuation that only means something at the start of a line, so
 * that prose hyphens elsewhere do not grow backslashes. */
function escapeBlockStart(text: string): string {
	if (/^\d+\./u.test(text)) {
		return text.replace('.', '\\.')
	}
	return text.replace(/^([#>+-])/u, '\\$1')
}

const BOLD_TAGS = new Set(['b', 'strong'])
const BOLD_STYLE = /font-weight:\s*(?:700|800|900|bold)/iu

function isBold(node: Element): boolean {
	if (BOLD_TAGS.has(node.name.toLowerCase())) return true
	return BOLD_STYLE.test(node.attribs['style'] ?? '')
}

const ITALIC_TAGS = new Set(['i', 'em'])
const ITALIC_STYLE = /font-style:\s*italic/iu

function isItalic(node: Element): boolean {
	if (ITALIC_TAGS.has(node.name.toLowerCase())) return true
	return ITALIC_STYLE.test(node.attribs['style'] ?? '')
}

/** Wraps text in emphasis markers, keeping whitespace outside them — `**bold: **`
 * is literal asterisks in markdown, not emphasis. */
function emphasise(inner: string, marker: string): string {
	const trimmed = inner.trim()
	if (!trimmed) return inner

	const leading = inner.slice(0, inner.length - inner.trimStart().length)
	const trailing = inner.slice(inner.trimEnd().length)
	return `${leading}${marker}${trimmed}${marker}${trailing}`
}

function renderInline(nodes: ChildNode[]): string {
	let result = ''

	for (const node of nodes) {
		if (isText(node)) {
			result += escapeInline(node.data)
			continue
		}

		if (!isTag(node)) continue

		const tag = node.name.toLowerCase()
		if (tag === 'script' || tag === 'style') continue

		if (tag === 'br') {
			// Two trailing spaces: markdown's hard line break, which breaks the
			// line without starting a new paragraph.
			result += '  \n'
			continue
		}

		if (tag === 'a') {
			const href = node.attribs['href']
			const text = renderInline(node.children)
			result += href ? `[${text}](${href})` : text
			continue
		}

		const inner = renderInline(node.children)
		if (isBold(node)) {
			result += emphasise(inner, '**')
		} else if (isItalic(node)) {
			result += emphasise(inner, '_')
		} else {
			result += inner
		}
	}

	return result
}

const BLOCK_CONTAINERS = new Set(['p', 'div', 'section', 'article', 'header', 'footer'])

function renderList(list: Element, depth: number): string {
	const ordered = list.name.toLowerCase() === 'ol'
	const indent = '\t'.repeat(depth)
	const items: string[] = []

	for (const child of list.children) {
		if (!isTag(child) || child.name.toLowerCase() !== 'li') continue

		const marker = ordered ? `${items.length + 1}. ` : '- '
		// A nested list already carries its own indentation, so its blocks join
		// in as they are. A `<p>` sibling inside an `<li>` would not be indented.
		const [first = '', ...rest] = renderBlocks(child.children, depth + 1)
		items.push([`${indent}${marker}${first}`, ...rest].join('\n'))
	}

	return items.join('\n')
}

function renderBlocks(nodes: ChildNode[], depth: number): string[] {
	const blocks: string[] = []
	let pending: ChildNode[] = []

	const flush = (): void => {
		if (pending.length === 0) return

		const text = renderInline(pending).trim()
		pending = []
		if (text) blocks.push(escapeBlockStart(text))
	}

	for (const node of nodes) {
		if (isTag(node)) {
			const tag = node.name.toLowerCase()

			if (tag === 'ul' || tag === 'ol') {
				flush()
				const list = renderList(node, depth)
				if (list) blocks.push(list)
				continue
			}

			if (BLOCK_CONTAINERS.has(tag)) {
				flush()
				blocks.push(...renderBlocks(node.children, depth))
				continue
			}
		}

		pending.push(node)
	}

	flush()
	return blocks
}

/**
 * Converts a parsed HTML node to markdown.
 *
 * Covers the tags real-world prose actually uses — paragraphs, divs, `<br>`,
 * lists, links, and both tag-based and inline-styled bold and italic — and
 * escapes markdown punctuation appearing in text so it renders literally.
 */
export function nodeToMarkdown(node: AnyNode): string {
	const children = 'children' in node ? (node.children as ChildNode[]) : []
	return nodesToMarkdown(children)
}

/** Converts a run of sibling nodes to markdown. See `nodeToMarkdown`. */
export function nodesToMarkdown(nodes: ChildNode[]): string {
	return renderBlocks(nodes, 0).join('\n\n').trim()
}

/** Converts an HTML string to markdown. See `nodeToMarkdown`. */
export function htmlToMarkdown(html: string): string {
	return nodeToMarkdown(parseHtml(html))
}
