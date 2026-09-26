import type {Block, MessStory, StoryLayout} from '../types'
import {parseCrossword} from './crossword'
import {parseHoroscopes} from './horoscopes'
import {parsePoem} from './poem'

/** What a story brings to `chooseLayout`: its column, its parsed body and photo, and the raw HTML. */
export type LayoutInput = {
	column: string | null
	blocks: Block[]
	photo: MessStory['photo']
	/** The raw body, for templates that need what the block parser discards */
	html: string
}

/**
 * The template for a story's column, or the article when it has none or its
 * rules fail, with the body blocks the template leaves to draw.
 */
export function chooseLayout(input: LayoutInput): {layout: StoryLayout; blocks: Block[]} {
	switch (input.column) {
		// The reader draws the layout rather than the blocks; they stay for the article fallback.
		case 'Horoscopes':
			return {layout: parseHoroscopes(input.blocks), blocks: input.blocks}
		case 'Poetry':
			return {layout: parsePoem(input.html), blocks: input.blocks}
		case 'Comic':
		case 'Artwork': {
			if (input.photo) {
				let {url, width, height} = input.photo
				return {layout: {kind: 'image', image: {url, width, height}}, blocks: input.blocks}
			}
			let index = input.blocks.findIndex((b) => b.type === 'figure')
			let figure = input.blocks[index]
			if (figure?.type !== 'figure') return {layout: {kind: 'article'}, blocks: input.blocks}
			let {url, width, height} = figure
			return {
				layout: {kind: 'image', image: {url, width, height}},
				blocks: input.blocks.filter((_, i) => i !== index),
			}
		}
		case 'Crossword': {
			let crossword = parseCrossword(input.html)
			if (!crossword) return {layout: {kind: 'article'}, blocks: input.blocks}
			return {layout: {kind: 'crossword', puzzle: crossword.puzzle}, blocks: crossword.blocks}
		}
		default:
			return {layout: {kind: 'article'}, blocks: input.blocks}
	}
}
