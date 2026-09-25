import {describe, expect, it} from '@jest/globals'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import {parseMessCategories} from '../posts'
import {filterTree, resolveFilter} from '../filter'

const tree = filterTree(parseMessCategories(categoriesJson))

/** The column names under one section of the tree. */
const columnsOf = (section: string): string[] | undefined =>
	tree.find((branch) => branch.section.name === section)?.columns.map((c) => c.name)

describe('filterTree', () => {
	it('lists the main sections, then Special Edition, in the paper’s order', () => {
		expect(tree.map((branch) => branch.section.name)).toStrictEqual([
			'News',
			'Opinions',
			'Arts & Entertainment',
			'Sports',
			'Variety',
			'Special Edition',
		])
	})

	it('gives Variety its columns, A–Z', () => {
		expect(columnsOf('Variety')).toStrictEqual([
			'Artwork',
			'Comic',
			'Crossword',
			'Horoscopes',
			'Photo',
			'Playlist',
			'Poetry',
			'Recipes',
			'Short Story',
		])
	})

	it('gives Arts & Entertainment Heartbeat and StoReview', () => {
		expect(columnsOf('Arts & Entertainment')).toStrictEqual(['Heartbeat', 'StoReview'])
	})

	it('leaves out the Featured flags and Uncategorized', () => {
		let names = tree.flatMap((branch) => [branch.section, ...branch.columns]).map((c) => c.name)
		expect(
			names.filter((name) => /featured|uncategorized|online exclusive/iu.test(name)),
		).toStrictEqual([])
	})

	it('skips a section the tree does not have', () => {
		let withoutSpecial = parseMessCategories(categoriesJson).filter(
			(c) => c.name !== 'Special Edition' && c.parent !== 1140,
		)
		expect(filterTree(withoutSpecial).map((branch) => branch.section.name)).not.toContain(
			'Special Edition',
		)
	})
})

describe('resolveFilter', () => {
	it('finds a column’s category id', () => {
		expect(resolveFilter('Poetry', tree)).toBe(69)
	})

	it('finds a section’s category id', () => {
		expect(resolveFilter('Variety', tree)).toBe(23)
	})

	it('gives null for no choice', () => {
		expect(resolveFilter(null, tree)).toBeNull()
	})

	it('gives null for a name the tree no longer has', () => {
		expect(resolveFilter('Classifieds', tree)).toBeNull()
	})

	it('gives null for a name the picker leaves out, such as a Featured flag', () => {
		expect(resolveFilter('Featured', tree)).toBeNull()
	})
})
