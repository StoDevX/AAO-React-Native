import {isTag, isText, parseHtml, type ChildNode} from '@frogpond/html-lib'
import type {PoemLine, Run, StoryLayout} from '../types'
import {pushRun, SKIPPED, styleWithin, trimRuns, type Style} from './blocks'

const MAX_INDENT = 6

/** A paragraph's runs split at each `<br>`, spaces inside a run kept as written. */
function linesOf(nodes: ChildNode[], style: Style, lines: Run[][]): void {
	for (let node of nodes) {
		if (isText(node)) {
			let current = lines.at(-1)
			if (!current) continue
			// A non-breaking space counts as a space, so indentation made of them is measured too.
			let text = node.data.replaceAll(' ', ' ').replaceAll(/[\r\n\t]+/gu, ' ')
			pushRun(current, text, style)
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

/** A line's leading spaces as an indent level, with the rest of its spacing collapsed; null when blank. */
function toLine(runs: Run[]): PoemLine | null {
	let plain = runs.map((run) => run.text).join('')
	if (plain.trim() === '') return null
	let leading = /^ */u.exec(plain)?.[0].length ?? 0
	let indent = Math.min(MAX_INDENT, Math.floor(leading / 2))
	let tidy = runs.map((run) => ({...run, text: run.text.replaceAll(/ {2,}/gu, ' ')}))
	return {indent, runs: trimRuns(tidy)}
}

/**
 * A poem, read from its raw HTML: one line per paragraph or `<br>`, stanzas
 * split at blank paragraphs, and the poet's indentation kept as levels.
 * Fewer than two lines is not a poem, so it falls back to the article.
 */
export function parsePoem(html: string): StoryLayout {
	let stanzas: PoemLine[][] = [[]]
	for (let node of parseHtml(html).children) {
		if (!isTag(node) || SKIPPED.has(node.name)) continue
		let rawLines: Run[][] = [[]]
		linesOf(node.children, {}, rawLines)
		let lines = rawLines.map(toLine)
		if (lines.every((line) => line === null)) {
			// A blank paragraph ends the stanza; several in a row end it once.
			if ((stanzas.at(-1)?.length ?? 0) > 0) stanzas.push([])
			continue
		}
		for (let line of lines) if (line) stanzas.at(-1)?.push(line)
	}
	stanzas = stanzas.filter((stanza) => stanza.length > 0)
	let count = stanzas.reduce((sum, stanza) => sum + stanza.length, 0)
	return count >= 2 ? {kind: 'poem', stanzas} : {kind: 'article'}
}
