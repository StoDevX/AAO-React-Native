import type {SelectableTextParagraph, SelectableTextRun} from '@frogpond/selectable-text'
import type {Block, Run} from '../types'
import {linkBareUrls} from './markdown'
import {splitOpening} from './opening'

/** How far a quote sits in from the column's edge, in points. */
const QUOTE_INDENT = 16
/** The space between a list's items, in points, tighter than between paragraphs. */
const LIST_ITEM_SPACING = 6

type Figure = Extract<Block, {type: 'figure' | 'embed' | 'gallery'}>

/**
 * One part of a story's body as the reader draws it: a stretch of prose between figures, set
 * as one text so a selection can run across its paragraphs, or a figure, embed or gallery on its own.
 */
export type BodyPart =
	| {kind: 'prose'; paragraphs: SelectableTextParagraph[]}
	| {kind: 'block'; block: Figure}

/** A paragraph's runs, its opening words set apart in small caps when it opens the story. */
function paragraphRuns(runs: Run[], isOpening: boolean): SelectableTextRun[] {
	if (!isOpening) return linkBareUrls(runs)
	let {opening, rest} = splitOpening(runs)
	if (opening === '') return linkBareUrls(runs)
	return [{text: opening, smallCaps: true}, ...linkBareUrls(rest)]
}

/** A prose block as the paragraphs it draws: one, or a list's items one apiece. */
function paragraphsOf(
	block: Exclude<Block, Figure>,
	isOpening: boolean,
): SelectableTextParagraph[] {
	switch (block.type) {
		case 'paragraph':
			return [{runs: paragraphRuns(block.runs, isOpening)}]
		case 'quote':
			return [{runs: linkBareUrls(block.runs), italic: true, indent: QUOTE_INDENT}]
		case 'list': {
			let last = block.items.length - 1
			return block.items.map((runs, index) => ({
				runs: linkBareUrls(runs),
				marker: block.ordered ? `${index + 1}.` : '•',
				...(index < last ? {spacingAfter: LIST_ITEM_SPACING} : {}),
			}))
		}
		default: {
			// Every prose block type is drawn above; a new one stops the compiler here.
			let _unhandled: never = block
			return []
		}
	}
}

/**
 * A story's blocks grouped for drawing: each run of paragraphs, quotes and lists becomes one
 * stretch of prose, and each figure, embed or gallery ends the stretch before it. When the blocks open
 * the story, the first paragraph's opening words are set in small caps, even after a figure.
 */
export function bodyParts(blocks: Block[], {opens}: {opens: boolean}): BodyPart[] {
	let openingIndex = opens ? blocks.findIndex((block) => block.type === 'paragraph') : -1
	let parts: BodyPart[] = []
	for (let [index, block] of blocks.entries()) {
		if (block.type === 'figure' || block.type === 'embed' || block.type === 'gallery') {
			parts.push({kind: 'block', block})
			continue
		}
		let paragraphs = paragraphsOf(block, index === openingIndex)
		let last = parts.at(-1)
		if (last?.kind === 'prose') last.paragraphs.push(...paragraphs)
		else parts.push({kind: 'prose', paragraphs})
	}
	return parts
}
