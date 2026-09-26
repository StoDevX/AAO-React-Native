import {describe, expect, it} from '@jest/globals'
import fixtures from '../../__tests__/fixtures/recipe-feature-posts.json'
import type {Block, Run, StoryLayout} from '../../types'
import {parseBlocks} from '../blocks'
import {parseRecipe} from '../recipe'

type Recipe = Extract<StoryLayout, {kind: 'recipe'}>

/** A fixture post's body, as `chooseLayout` receives it. */
const blocksOf = (id: number): Block[] =>
	parseBlocks(fixtures.find((p) => p.id === id)?.content.rendered ?? '')

/** Hand-written blocks: a paragraph per string, and an ordered list per array of strings. */
function body(...parts: Array<string | string[]>): Block[] {
	return parts.map((part): Block =>
		typeof part === 'string'
			? {type: 'paragraph', runs: [{text: part}]}
			: {type: 'list', ordered: true, items: part.map((text) => [{text}])},
	)
}

/** The recipe a body parses to; fails the test when it parses to anything else. */
function recipe(blocks: Block[]): Recipe {
	let layout = parseRecipe(blocks)
	if (layout.kind !== 'recipe') throw new Error(`expected a recipe, got ${layout.kind}`)
	return layout
}

/** Each section as its label, its kind and how many items it has. */
const outline = (layout: Recipe) =>
	layout.sections.map((section) => [section.label, section.kind, section.items.length])

const plain = (runs: Run[]): string => runs.map((run) => run.text).join('')

/** A block's text, as the reader would find it on the page. */
function textOf(block: Block): string {
	if (block.type === 'list') return block.items.map(plain).join(' ')
	if (block.type === 'figure') return `${block.url} ${block.caption}`
	if (block.type === 'embed') return block.url
	return plain(block.runs)
}

/** Every word in some text, a colon counting as a space: a label keeps its words but not its colon. */
const wordsIn = (texts: string[]): string[] =>
	texts
		.join(' ')
		.replaceAll(':', ' ')
		.split(/\s+/u)
		.filter((word) => word !== '')

describe('parseRecipe', () => {
	it('reads three ingredient sections and the steps (36493)', () => {
		let layout = recipe(blocksOf(36493))
		expect(outline(layout)).toStrictEqual([
			['Shortbread ingredients', 'ingredients', 6],
			['Lemon filling ingredients', 'ingredients', 4],
			['Additional ingredients', 'ingredients', 1],
			['Instructions', 'steps', 8],
		])
		expect(layout.sections[0]?.items[0]).toStrictEqual([
			{text: '2 ⅔ sticks (300g) unsalted butter, room temperature'},
		])
		expect(layout.intro).toHaveLength(1)
		expect(layout.after).toStrictEqual([])
	})

	it('reads one ingredient section (36402)', () => {
		expect(outline(recipe(blocksOf(36402)))).toStrictEqual([
			['Ingredients', 'ingredients', 16],
			['Instructions', 'steps', 8],
		])
	})

	it('reads ingredients given as list items, and keeps what follows the steps (36060)', () => {
		let layout = recipe(blocksOf(36060))
		expect(outline(layout)).toStrictEqual([
			['Ingredients', 'ingredients', 4],
			['Directions', 'steps', 4],
		])
		expect(layout.sections[0]?.items[0]).toStrictEqual([{text: '227 grams starter (prepped)'}])
		expect(layout.intro).toStrictEqual([])
		expect(layout.after).toStrictEqual([{type: 'paragraph', runs: [{text: 'Enjoy!'}]}])
	})

	it('reads steps with no ingredients, under a label with no colon (36074)', () => {
		let layout = recipe(blocksOf(36074))
		expect(outline(layout)).toStrictEqual([['Directions', 'steps', 8]])
		expect(layout.intro).toHaveLength(1)
		expect(layout.after).toHaveLength(1)
	})

	it.each([36493, 36402, 36060, 36074])('keeps every word of %i, in order', (id) => {
		let blocks = blocksOf(id)
		let layout = recipe(blocks)
		let laidOut = [
			...layout.intro.map(textOf),
			...layout.sections.flatMap((section) => [section.label, ...section.items.map(plain)]),
			...layout.after.map(textOf),
		]
		expect(wordsIn(laidOut)).toStrictEqual(wordsIn(blocks.map(textOf)))
	})

	// Hand-written: all 13 live recipes have steps.
	it('draws a post with no steps as an article', () => {
		expect(parseRecipe(body('Ingredients:', '1 egg', '1 cup milk'))).toStrictEqual({
			kind: 'article',
		})
	})

	it('takes an ordered list with no label as steps labelled Directions', () => {
		let layout = recipe(body('A family favourite.', ['Stir.', 'Bake.'], 'Enjoy!'))
		expect(outline(layout)).toStrictEqual([['Directions', 'steps', 2]])
		expect(layout.intro).toStrictEqual(body('A family favourite.'))
		expect(layout.after).toStrictEqual(body('Enjoy!'))
	})

	it('takes a label with no colon only when it is one of the usual names', () => {
		let layout = recipe(body('Shortbread Cookies', 'Instructions', ['Stir.']))
		expect(layout.intro).toStrictEqual(body('Shortbread Cookies'))
		expect(outline(layout)).toStrictEqual([['Instructions', 'steps', 1]])
	})

	it('does not take a line of more than six words as a label, colon or not', () => {
		let layout = recipe(body('Here is everything you will need to buy:', 'Directions:', ['Stir.']))
		expect(layout.intro).toStrictEqual(body('Here is everything you will need to buy:'))
		expect(outline(layout)).toStrictEqual([['Directions', 'steps', 1]])
	})

	it('reads what to do from the label, and anything else as what goes in', () => {
		let layout = recipe(
			body(
				'Method',
				['Stir.'],
				'Ingredients (icing):',
				'1 cup sugar',
				'Materials:',
				'Tinfoil',
				'Steps (icing):',
				['Whisk.'],
			),
		)
		expect(outline(layout)).toStrictEqual([
			['Method', 'steps', 1],
			['Ingredients (icing)', 'ingredients', 1],
			['Materials', 'ingredients', 1],
			['Steps (icing)', 'steps', 1],
		])
	})

	// The note would belong to neither the introduction nor what follows.
	it('draws a post with a block stranded between two sections as an article', () => {
		let blocks: Block[] = [
			{type: 'paragraph', runs: [{text: 'Ingredients:'}]},
			{type: 'list', ordered: false, items: [[{text: '1 egg'}]]},
			{type: 'paragraph', runs: [{text: 'Use a fresh egg.'}]},
			{type: 'paragraph', runs: [{text: 'Directions:'}]},
			{type: 'list', ordered: true, items: [[{text: 'Stir.'}]]},
		]
		expect(parseRecipe(blocks)).toStrictEqual({kind: 'article'})
	})
})
