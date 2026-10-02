import {isTag, isText, parseHtml, type ChildNode} from '@frogpond/html-lib'
import type {PoemLine, Run, StoryLayout} from '../types'
import {pushRun, SKIPPED, styleWithin, trimRuns, type Style} from './blocks'

/** The deepest indent level; wider indents share it. */
const MAX_INDENT = 6

/** A run of the spacing HTML collapses to one space: everything but the non-breaking space. */
const COLLAPSIBLE = /[ \t\r\n]+/gu

/** A line before its indent is ranked: how many characters wide its indent draws, and its tidied runs. */
type MeasuredLine = {width: number; runs: Run[]}

/** A paragraph's runs split at each `<br>`, spaces inside a run kept as written. */
function linesOf(nodes: ChildNode[], style: Style, lines: Run[][]): void {
	for (let node of nodes) {
		if (isText(node)) {
			let current = lines.at(-1)
			if (!current) continue
			// Spacing stays as written until the line is measured, which tells ordinary spaces
			// from non-breaking ones.
			pushRun(current, node.data, style)
			continue
		}
		if (!isTag(node) || SKIPPED.has(node.name)) continue
		if (node.name === 'br') {
			lines.push([])
			continue
		}
		linesOf(node.children, styleWithin(node, style), lines)
	}
}

/**
 * A line's indent width as the site draws it, with the rest of its spacing collapsed; null when
 * blank. HTML collapses each run of ordinary spaces, tabs and newlines to one space and drops it
 * at the start of a line, but keeps every non-breaking space; so only an indent made of
 * non-breaking spaces shows, and an ordinary space counts only between them.
 */
function measure(runs: Run[]): MeasuredLine | null {
	let plain = runs.map((run) => run.text).join('')
	if (plain.trim() === '') return null
	let drawn = plain.replaceAll(COLLAPSIBLE, ' ').replace(/^ /u, '')
	let width = /^[\u00A0 ]*/u.exec(drawn)?.[0].length ?? 0
	let tidy = runs.map((run) => ({
		...run,
		text: run.text.replaceAll('\u00A0', ' ').replaceAll(COLLAPSIBLE, ' '),
	}))
	return {width, runs: trimRuns(tidy)}
}

/**
 * A poem, read from its raw HTML: one line per paragraph or `<br>`, and
 * stanzas split at blank paragraphs. When any paragraph holds several lines,
 * the poet wrote a stanza per paragraph, so each paragraph ends its stanza too.
 *
 * Indentation is kept by rank rather than by width: a flush line is level 0,
 * the narrowest indent across the poem level 1, the next narrowest level 2,
 * and so on up to `MAX_INDENT`.
 *
 * Fewer than two lines is not a poem, and nor is text outside every
 * paragraph, which the parser could not place; both fall back to the article.
 */
export function parsePoem(html: string): StoryLayout {
	// Each paragraph's lines, or null for a blank paragraph.
	let paragraphs: Array<MeasuredLine[] | null> = []
	for (let node of parseHtml(html).children) {
		if (isText(node) && node.data.trim() !== '') return {kind: 'article'}
		if (!isTag(node) || SKIPPED.has(node.name)) continue
		let rawLines: Run[][] = [[]]
		linesOf(node.children, {}, rawLines)
		let lines = rawLines.map(measure).filter((line) => line !== null)
		paragraphs.push(lines.length > 0 ? lines : null)
	}

	let widths = [...new Set(paragraphs.flatMap((lines) => lines ?? []).map((l) => l.width))]
		.filter((width) => width > 0)
		.sort((a, b) => a - b)
	let levelOf = (width: number) =>
		width === 0 ? 0 : Math.min(MAX_INDENT, widths.indexOf(width) + 1)

	let stanzaPerParagraph = paragraphs.some((lines) => (lines?.length ?? 0) > 1)
	let stanzas: PoemLine[][] = [[]]
	for (let lines of paragraphs) {
		for (let line of lines ?? []) {
			stanzas.at(-1)?.push({indent: levelOf(line.width), runs: line.runs})
		}
		// A stanza ends here; several endings in a row end it once.
		let ends = lines === null || stanzaPerParagraph
		if (ends && (stanzas.at(-1)?.length ?? 0) > 0) stanzas.push([])
	}
	stanzas = stanzas.filter((stanza) => stanza.length > 0)
	let count = stanzas.reduce((sum, stanza) => sum + stanza.length, 0)
	return count >= 2 ? {kind: 'poem', stanzas} : {kind: 'article'}
}
