import type {Block, MessStory, StoryLayout} from '../types'
import {parseHoroscopes} from './horoscopes'

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
		default:
			return {layout: {kind: 'article'}, blocks: input.blocks}
	}
}
