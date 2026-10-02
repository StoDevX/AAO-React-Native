import {MAIN_SECTIONS, SPECIAL_EDITION} from './posts'
import type {MessCategory} from '../types'

/** One section the filter offers, with its columns A–Z. */
export type FilterBranch = {section: MessCategory; columns: MessCategory[]}

/**
 * The sections the filter offers, in the paper's order. The Featured flags,
 * Uncategorized and the paper's minor top-level categories are left out by
 * naming only these.
 */
const FILTER_SECTIONS = [...MAIN_SECTIONS, SPECIAL_EDITION]

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
