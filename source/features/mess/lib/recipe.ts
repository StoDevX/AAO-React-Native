import type {Block, RecipeSection, Run, StoryLayout} from '../types'

/** Labels a recipe uses bare, with or without a colon, compared lowercased. */
const NAMED_LABELS = new Set(['ingredients', 'directions', 'instructions', 'method', 'steps'])
/** The most words a paragraph ending in a colon can have and still read as a label. */
const MAX_LABEL_WORDS = 6
/** A label naming what to do, rather than what goes in. */
const STEPS_LABEL = /direction|instruction|method|step/iu
/** The label given to an ordered list that has none of its own. */
const UNLABELLED_STEPS = 'Directions'

/** A paragraph's text, trimmed. */
function plainText(runs: Run[]): string {
	return runs
		.map((run) => run.text)
		.join('')
		.trim()
}

/**
 * The label a block gives a section, without its colon, or null when it gives none: a
 * paragraph of at most six words ending in a colon, or one of the usual bare labels.
 */
function labelOf(block: Block): string | null {
	if (block.type !== 'paragraph') return null
	let text = plainText(block.runs)
	let label = text.replace(/\s*:$/u, '')
	if (label === '') return null
	let isShortWithColon = text.endsWith(':') && text.split(/\s+/u).length <= MAX_LABEL_WORDS
	return isShortWithColon || NAMED_LABELS.has(label.toLowerCase()) ? label : null
}

/**
 * A Recipes post as its introduction, its sections of ingredients and of steps, and what
 * follows them. A label starts a section; its items are the list right after the label, or
 * else each paragraph up to the next label, list or figure. An ordered list with no label
 * of its own is a steps section. Every block lands in the introduction, a section or what
 * follows, so a post with a block stranded between two sections, or with no steps, is
 * drawn as an article.
 */
export function parseRecipe(blocks: Block[]): StoryLayout {
	let intro: Block[] = []
	let sections: RecipeSection[] = []
	let after: Block[] = []
	let current: RecipeSection | null = null
	// What the newest section can still take: the list right after its label, or paragraphs.
	let takesList = false
	let takesParagraphs = false

	for (let block of blocks) {
		let label = labelOf(block)
		if (label !== null) {
			// A block between two sections belongs to neither.
			if (after.length > 0) return {kind: 'article'}
			current = {label, kind: STEPS_LABEL.test(label) ? 'steps' : 'ingredients', items: []}
			sections.push(current)
			takesList = true
			takesParagraphs = true
			continue
		}
		if (block.type === 'list' && current !== null && takesList) {
			current.items.push(...block.items)
			takesList = false
			takesParagraphs = false
			continue
		}
		if (block.type === 'list' && block.ordered) {
			if (after.length > 0) return {kind: 'article'}
			current = {label: UNLABELLED_STEPS, kind: 'steps', items: [...block.items]}
			sections.push(current)
			takesList = false
			takesParagraphs = false
			continue
		}
		if (block.type === 'paragraph' && current !== null && takesParagraphs) {
			current.items.push(block.runs)
			takesList = false
			continue
		}
		// Anything else ends the newest section's items.
		takesList = false
		takesParagraphs = false
		;(sections.length === 0 ? intro : after).push(block)
	}

	if (!sections.some((section) => section.kind === 'steps')) return {kind: 'article'}
	return {kind: 'recipe', intro, sections, after}
}
