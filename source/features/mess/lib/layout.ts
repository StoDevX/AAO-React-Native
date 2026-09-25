import type {Block, MessStory, StoryLayout} from '../types'

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
		default:
			return {layout: {kind: 'article'}, blocks: input.blocks}
	}
}
