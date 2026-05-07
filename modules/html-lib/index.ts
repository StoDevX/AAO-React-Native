import {parseDocument} from 'htmlparser2'
import {textContent} from 'domutils'
import {AnyNode, Document, isText, isTag, type ChildNode} from 'domhandler'
import cssSelect from 'css-select'

export {textContent, cssSelect}
export {isText, isTag}
export type {ChildNode}
export {encode, decode} from 'html-entities'

export function parseHtml(string: string): Document {
	return parseDocument(string, {
		xmlMode: false,
		decodeEntities: true,
	})
}

export function innerTextWithSpaces(elem: AnyNode): string {
	return textContent(elem).split(/\s+/u).join(' ').trim()
}

export function removeHtmlWithRegex(str: string): string {
	return str.replace(/<[^>]*>/gu, ' ')
}

export function fastGetTrimmedText(str: string): string {
	return removeHtmlWithRegex(str).replace(/\s+/gu, ' ').trim()
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

function walkSegments(
	nodes: ChildNode[],
	segments: Segment[],
	listContext?: 'ul' | 'ol',
): void {
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

export function htmlToSegments(html: string): Segment[] {
	const doc = parseHtml(html)
	const segments: Segment[] = []
	walkSegments(doc.children, segments)
	return normalizeSegments(segments)
}
