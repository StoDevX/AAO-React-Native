import type {FilterType} from '../types'

export type FilterShape = 'menu' | 'sheet' | 'none'

// Menus' Stations filter is the one this is tuned for: a station list this
// long is quicker to work through as a sheet of rows than as a pull-down. The
// runtime-derived News and Streaming Media Categories filters have no fixed
// count and cross it too, whenever a feed carries this many categories.
const SHEET_THRESHOLD = 8

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
