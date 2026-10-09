import {SPECIAL_EDITION} from './posts'
import type {MessCategory} from '../types'

/** One section the filter offers, with its columns A–Z. */
export type FilterBranch = {section: MessCategory; columns: MessCategory[]}

/**
 * The paper's sections and their columns, as the filter menu lists them, in the paper's order.
 * The Featured flags, Uncategorized and the paper's minor top-level categories are left out by
 * naming only its main sections and Special Edition.
 */
export function filterTree(
	categories: MessCategory[],
	mainSections: readonly string[],
): FilterBranch[] {
	return [...mainSections, SPECIAL_EDITION].flatMap((name) => {
		let section = categories.find((c) => c.parent === 0 && c.name === name)
		if (!section) return []
		let columns = categories
			.filter((c) => c.parent === section.id)
			.sort((a, b) => a.name.localeCompare(b.name))
		return [{section, columns}]
	})
}
