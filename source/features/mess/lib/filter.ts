import {MAIN_SECTIONS} from './posts'
import type {MessCategory} from '../types'

/** One section the filter offers, with its columns A–Z. */
export type FilterBranch = {section: MessCategory; columns: MessCategory[]}

/**
 * The sections the filter offers, in the paper's order. The Featured flags,
 * Uncategorized and the paper's minor top-level categories are left out by
 * naming only these.
 */
const FILTER_SECTIONS = [...MAIN_SECTIONS, 'Special Edition']

/** The paper's sections and their columns, as the filter menu lists them. */
export function filterTree(categories: MessCategory[]): FilterBranch[] {
	return FILTER_SECTIONS.flatMap((name) => {
		let section = categories.find((c) => c.parent === 0 && c.name === name)
		if (!section) return []
		let columns = categories
			.filter((c) => c.parent === section.id)
			.sort((a, b) => a.name.localeCompare(b.name))
		return [{section, columns}]
	})
}

/**
 * The category id a saved section or column name stands for, or null for the whole feed.
 * Undefined while a name is saved but the tree has not loaded, since only the tree can tell
 * which list the name means.
 */
export function resolveFilter(
	name: string | null,
	tree: FilterBranch[] | undefined,
): number | null | undefined {
	if (name === null) return null
	if (tree === undefined) return undefined
	let match = tree
		.flatMap((branch) => [branch.section, ...branch.columns])
		.find((category) => category.name === name)
	return match?.id ?? null
}
