import {
	isTag,
	isText,
	parseHtml,
	textContent,
	type ChildNode,
	type Element,
} from '@frogpond/html-lib'
import type {Block, Run} from '../types'

type Style = Omit<Run, 'text'>

const SKIPPED = new Set(['script', 'style'])

/** Elements that stand as their own block even when WordPress wraps them in a paragraph. */
const MEDIA = ['img', 'iframe']

/** Collapses whitespace the way a browser would, keeping the newlines `<br>` produced. */
function collapse(text: string): string {
	return text.replaceAll(/[ \t\r\n\u00A0]+/gu, ' ')
}

function sameStyle(a: Style, b: Style): boolean {
	return a.bold === b.bold && a.italic === b.italic && a.href === b.href
}

function pushRun(runs: Run[], text: string, style: Style): void {
	if (text === '') return
	let last = runs.at(-1)
	if (last && sameStyle(last, style)) {
		last.text += text
		return
	}
	runs.push({text, ...style})
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
		let next: Style = {...style}
		if (node.name === 'b' || node.name === 'strong') next.bold = true
		if (node.name === 'i' || node.name === 'em') next.italic = true
		if (node.name === 'a' && node.attribs.href) next.href = node.attribs.href
		collectRuns(node.children, next, runs)
	}
}

/**
 * Runs with the whitespace at either end of the block removed, and a space
 * beside a line break dropped. Empty when the block held no words.
 */
function runsOf(nodes: ChildNode[]): Run[] {
	let runs: Run[] = []
	collectRuns(nodes, {}, runs)
	for (let run of runs) run.text = run.text.replaceAll(/ ?\n ?/gu, '\n')
	let first = runs[0]
	if (first) first.text = first.text.trimStart()
	let last = runs.at(-1)
	if (last) last.text = last.text.trimEnd()
	return runs.filter((run) => run.text !== '')
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

function figureFrom(img: Element, caption: string): Block | null {
	let url = img.attribs.src
	let width = Number.parseInt(img.attribs.width ?? '', 10)
	let height = Number.parseInt(img.attribs.height ?? '', 10)
	// An image with no size cannot be given its frame before it loads.
	if (!url || !Number.isFinite(width) || !Number.isFinite(height)) return null
	return {type: 'figure', url, width, height, caption}
}

function pushParagraph(blocks: Block[], nodes: ChildNode[]): void {
	let runs = runsOf(nodes)
	if (runs.length > 0) blocks.push({type: 'paragraph', runs})
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
			if (iframe) return blocksOf(iframe, blocks)
			let img = descendants(node, 'img')[0]
			let caption = descendants(node, 'figcaption')[0]
			let captionText = caption ? collapse(textContent(caption)).trim() : ''
			let figure = img ? figureFrom(img, captionText) : null
			if (figure) blocks.push(figure)
			else if (!img) pushParagraph(blocks, node.children)
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

/** A story's HTML body as blocks, in reading order. No words are dropped; scripts and styles are. */
export function parseBlocks(html: string): Block[] {
	let blocks: Block[] = []
	for (let node of parseHtml(html).children) {
		if (isText(node)) {
			pushParagraph(blocks, [node])
			continue
		}
		if (isTag(node) && !SKIPPED.has(node.name)) blocksOf(node, blocks)
	}
	return blocks
}
