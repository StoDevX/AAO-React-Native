type TextNode = {
	type: 'text'
	data: string
}

type TagNode = {
	type: 'tag'
	name: string
	attribs: Record<string, string>
	children: ChildNode[]
}

type DocumentNode = {
	children: ChildNode[]
}

type ChildNode = TextNode | TagNode

function isText(node: ChildNode): node is TextNode {
	return node.type === 'text'
}

function isTag(node: ChildNode): node is TagNode {
	return node.type === 'tag'
}

function decodeHtmlEntities(text: string): string {
	const namedEntities: Record<string, string> = {
		amp: '&',
		lt: '<',
		gt: '>',
		quot: '"',
		apos: "'",
		nbsp: '\u00A0',
	}

	return text.replace(
		/&(#x[0-9a-f]{1,8}|#[0-9]{1,7}|[a-z]{1,10});/giu,
		(match, entity: string) => {
			const normalized = entity.toLowerCase()

			if (normalized.startsWith('#x')) {
				const cp = Number.parseInt(normalized.slice(2), 16)
				return Number.isNaN(cp) ? match : String.fromCodePoint(cp)
			}

			if (normalized.startsWith('#')) {
				const cp = Number.parseInt(normalized.slice(1), 10)
				return Number.isNaN(cp) ? match : String.fromCodePoint(cp)
			}

			return namedEntities[normalized] ?? match
		},
	)
}

function parseAttributes(attrString: string): Record<string, string> {
	const attrs: Record<string, string> = {}
	const pattern =
		/([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/gu
	for (const m of attrString.matchAll(pattern)) {
		attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
	}
	return attrs
}

function parseDocument(
	html: string,
	options?: {decodeEntities?: boolean},
): DocumentNode {
	const root: DocumentNode = {children: []}
	const stack: TagNode[] = []
	const voidTags = new Set([
		'area',
		'base',
		'br',
		'col',
		'embed',
		'hr',
		'img',
		'input',
		'link',
		'meta',
		'param',
		'source',
		'track',
		'wbr',
	])

	const append = (node: ChildNode): void => {
		const parent = stack[stack.length - 1]
		if (parent) {
			parent.children.push(node)
		} else {
			root.children.push(node)
		}
	}

	const tokenPattern = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/gu

	for (const {0: token} of html.matchAll(tokenPattern)) {
		if (token.startsWith('<!--')) continue

		if (token.startsWith('</')) {
			const name = token.slice(2, -1).trim().toLowerCase()
			for (let i = stack.length - 1; i >= 0; i -= 1) {
				if (stack[i].name === name) {
					stack.length = i
					break
				}
			}
			continue
		}

		if (token.startsWith('<')) {
			const inner = token.slice(1, -1).trim()
			const selfClosing = inner.endsWith('/')
			const nameMatch = inner.match(/^([^\s/]+)/u)
			if (!nameMatch) continue
			const name = nameMatch[1].toLowerCase()
			const node: TagNode = {
				type: 'tag',
				name,
				attribs: parseAttributes(inner.slice(nameMatch[0].length)),
				children: [],
			}
			append(node)
			if (!selfClosing && !voidTags.has(name)) stack.push(node)
			continue
		}

		const text = options?.decodeEntities ? decodeHtmlEntities(token) : token
		append({type: 'text', data: text})
	}

	return root
}
export type TextSegment = {type: 'text'; text: string}
export type LinkSegment = {type: 'link'; text: string; url: string}
export type Segment = TextSegment | LinkSegment

function walkNodes(nodes: ChildNode[], listContext?: 'ul' | 'ol'): string {
	let result = ''
	let olCounter = 0

	for (const node of nodes) {
		if (isText(node)) {
			// Skip whitespace-only text nodes (insignificant HTML formatting whitespace)
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
				// Skip Reddit's "submitted by" attribution table entirely
				break
			default:
				result += walkNodes(children)
		}
	}

	return result
}

export function htmlToFormattedText(html: string): string {
	const doc = parseDocument(html, {decodeEntities: true})
	const raw = walkNodes(doc.children)
	return raw.replace(/\n{3,}/gu, '\n\n').replace(/^\n+|\n+$/gu, '')
}

// ── Segment-aware walker ───────────────────────────────────────────────────

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
				// Trim trailing whitespace from last text segment
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
				// Indent each line by prepending "  "
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

function normalizeSegments(segments: Segment[]): Segment[] {
	// Clean up leading/trailing newlines from text segments and collapse 3+ newlines
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
	const doc = parseDocument(html, {decodeEntities: true})
	const segments: Segment[] = []
	walkSegments(doc.children, segments)
	return normalizeSegments(segments)
}
