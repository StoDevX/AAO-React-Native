import type {FilterType} from '../types'

export type FilterShape = 'menu' | 'sheet' | 'none'

// Nothing measured sits near this -- it exists only for the runtime-derived
// News/Streaming Media Categories filters, which have no fixed count.
const SHEET_THRESHOLD = 15

/**
 * Which presentation a filter gets. A toggle is always short enough for a
 * menu. A picker needs at least two options to pick between. A list is a
 * menu unless it is empty (nothing to show), carries icons (only a sheet
 * draws them, whatever its length), or reaches the sheet threshold.
 */
export function filterShape<T extends object>(filter: FilterType<T>): FilterShape {
	switch (filter.type) {
		case 'toggle':
			return 'menu'

		case 'picker':
			return filter.spec.options.length < 2 ? 'none' : 'menu'

		case 'list': {
			let {options, showIcons} = filter.spec

			if (options.length === 0) {
				return 'none'
			}
			if (showIcons || options.length >= SHEET_THRESHOLD) {
				return 'sheet'
			}
			return 'menu'
		}

		default:
			return 'none'
	}
}
