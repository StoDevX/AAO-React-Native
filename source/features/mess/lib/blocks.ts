import {
	isTag,
	isText,
	parseHtml,
	textContent,
	type ChildNode,
	type Element,
} from '@frogpond/html-lib'
import type {Block, Run} from '../types'

/** The formatting a run carries, without its text. */
export type Style = Omit<Run, 'text'>

/** Elements whose text is never shown. */
export const SKIPPED = new Set(['script', 'style'])

/** Elements that stand as their own block even when WordPress wraps them in a paragraph. */
const MEDIA = ['img', 'iframe']

/** Elements a browser starts on a line of their own. */
const BLOCK_LEVEL = new Set([
	'p',
	'div',
	'li',
	'blockquote',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'figure',
	'figcaption',
	'ul',
	'ol',
])

/** Collapses whitespace the way a browser would, keeping the newlines `<br>` produced. */
function collapse(text: string): string {
	return text.replaceAll(/[ \t\r\n\u00A0]+/gu, ' ')
}

function sameStyle(a: Style, b: Style): boolean {
	return a.bold === b.bold && a.italic === b.italic && a.href === b.href
}

/** Appends text to the last run when the style matches, or starts a new run. Drops empty text. */
export function pushRun(runs: Run[], text: string, style: Style): void {
	if (text === '') return
	let last = runs.at(-1)
	if (last && sameStyle(last, style)) {
		last.text += text
		return
	}
	runs.push({text, ...style})
}

/** The style of the text inside `node`: the enclosing style plus whatever bold, italic or link `node` adds. */
export function styleWithin(node: Element, style: Style): Style {
	let next: Style = {...style}
	if (node.name === 'b' || node.name === 'strong') next.bold = true
	if (node.name === 'i' || node.name === 'em') next.italic = true
	if (node.name === 'a' && node.attribs.href) next.href = node.attribs.href
	return next
}

/** Ends the current line, unless it is already ended or nothing precedes it. */
function breakLine(runs: Run[], style: Style): void {
	let last = runs.at(-1)
	if (!last || /\n *$/u.test(last.text)) return
	pushRun(runs, '\n', style)
}

function collectRuns(nodes: ChildNode[], style: Style, runs: Run[]): void {
	for (let node of nodes) {
		if (isText(node)) {
			pushRun(runs, collapse(node.data), style)
			continue
		}
		if (!isTag(node) || SKIPPED.has(node.name)) continue
		if (node.name === 'br') {
			pushRun(runs, '\n', style)
			continue
		}
		if (BLOCK_LEVEL.has(node.name)) {
			// Adjacent blocks inside one run of text keep their words apart.
			breakLine(runs, style)
			collectRuns(node.children, style, runs)
			breakLine(runs, style)
			continue
		}
		collectRuns(node.children, styleWithin(node, style), runs)
	}
}

/** Runs with the whitespace at either end removed, and any run left empty dropped. */
export function trimRuns(runs: Run[]): Run[] {
	// A run left empty by trimming lets the trim reach the one beside it.
	for (let first = runs[0]; first; first = runs[0]) {
		first.text = first.text.trimStart()
		if (first.text !== '') break
		runs.shift()
	}
	for (let last = runs.at(-1); last; last = runs.at(-1)) {
		last.text = last.text.trimEnd()
		if (last.text !== '') break
		runs.pop()
	}
	return runs.filter((run) => run.text !== '')
}

/**
 * Runs with the whitespace at either end of the block removed, and a space
 * beside a line break dropped. Empty when the block held no words.
 */
function runsOf(nodes: ChildNode[]): Run[] {
	let runs: Run[] = []
	collectRuns(nodes, {}, runs)
	for (let run of runs) run.text = run.text.replaceAll(/ ?\n ?/gu, '\n')
	return trimRuns(runs)
}

/** Every element below `node` with one of `names`, in document order. */
function descendants(node: Element, ...names: string[]): Element[] {
	let found: Element[] = []
	for (let child of node.children) {
		if (!isTag(child)) continue
		if (names.includes(child.name)) found.push(child)
		found.push(...descendants(child, ...names))
	}
	return found
}

/** The elements below `node` named `name` that no other such element encloses, in document order. */
function outermost(node: Element, name: string): Element[] {
	let found: Element[] = []
	for (let child of node.children) {
		if (!isTag(child)) continue
		if (child.name === name) found.push(child)
		else found.push(...outermost(child, name))
	}
	return found
}

function figureFrom(img: Element, caption: string): Block | null {
	let url = img.attribs.src
	let width = Number.parseInt(img.attribs.width ?? '', 10)
	let height = Number.parseInt(img.attribs.height ?? '', 10)
	// An image with no size cannot be given its frame before it loads, and a
	// zero size gives no aspect ratio.
	if (!url || !(width > 0 && height > 0)) return null
	return {type: 'figure', url, width, height, caption}
}

function pushParagraph(blocks: Block[], nodes: ChildNode[]): void {
	let runs = runsOf(nodes)
	if (runs.length > 0) blocks.push({type: 'paragraph', runs})
}

/** A figure's own caption, as a paragraph of its own. */
function pushFigcaption(blocks: Block[], figure: Element): void {
	pushParagraph(
		blocks,
		figure.children.filter((child) => isTag(child) && child.name === 'figcaption'),
	)
}

function blocksOf(node: Element, blocks: Block[]): void {
	switch (node.name) {
		case 'ol':
		case 'ul': {
			let items = node.children
				.filter((child): child is Element => isTag(child) && child.name === 'li')
				.map((li) => runsOf(li.children))
				.filter((runs) => runs.length > 0)
			if (items.length > 0) blocks.push({type: 'list', ordered: node.name === 'ol', items})
			return
		}
		case 'blockquote': {
			let runs = runsOf(node.children)
			if (runs.length > 0) blocks.push({type: 'quote', runs})
			return
		}
		case 'iframe': {
			if (node.attribs.src) blocks.push({type: 'embed', url: node.attribs.src})
			return
		}
		case 'figure': {
			let iframe = descendants(node, 'iframe')[0]
			if (iframe) {
				// An embed block: the player, then the caption WordPress sets below it.
				blocksOf(iframe, blocks)
				pushFigcaption(blocks, node)
				return
			}
			// Each nested figure reads its own nested figures, so only the outermost are read here.
			let nested = outermost(node, 'figure')
			if (nested.length > 0) {
				// A gallery: each image is its own figure, and the gallery's own caption follows them.
				for (let figure of nested) blocksOf(figure, blocks)
				pushFigcaption(blocks, node)
				return
			}
			let img = descendants(node, 'img')[0]
			let caption = descendants(node, 'figcaption')[0]
			let captionText = caption ? collapse(textContent(caption)).trim() : ''
			let figure = img ? figureFrom(img, captionText) : null
			if (figure) blocks.push(figure)
			// An image that cannot be shown contributes no runs, so this keeps only the caption's words.
			else pushParagraph(blocks, node.children)
			return
		}
		case 'img': {
			let figure = figureFrom(node, '')
			if (figure) blocks.push(figure)
			return
		}
		default: {
			// WordPress wraps a lone image or player in a paragraph; it is media, not text.
			for (let media of descendants(node, ...MEDIA)) blocksOf(media, blocks)
			pushParagraph(
				blocks,
				node.children.filter((child) => !(isTag(child) && MEDIA.includes(child.name))),
			)
		}
	}
}

/** Parsed HTML nodes as blocks, in reading order. No words are dropped; scripts and styles are. */
export function blocksFromNodes(nodes: ChildNode[]): Block[] {
	let blocks: Block[] = []
	for (let node of nodes) {
		if (isText(node)) {
			pushParagraph(blocks, [node])
			continue
		}
		if (isTag(node) && !SKIPPED.has(node.name)) blocksOf(node, blocks)
	}
	return blocks
}

/** A story's HTML body as blocks, in reading order. No words are dropped; scripts and styles are. */
export function parseBlocks(html: string): Block[] {
	return blocksFromNodes(parseHtml(html).children)
}
