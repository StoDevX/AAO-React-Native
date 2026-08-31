import type {FilterType} from '../types'

export type FilterShape = 'inline' | 'menu' | 'sheet' | 'none'

// Menus' Stations filter is the one this is tuned for: a station list this
// long is quicker to work through as a sheet of rows than as a pull-down. The
// runtime-derived News and Streaming Media Categories filters have no fixed
// count and cross it too, whenever a feed carries this many categories.
const SHEET_THRESHOLD = 8

/**
 * Which presentation a filter gets. A toggle has one state to change, so its
 * trigger is the control: tapping flips it, with nothing to present. A picker
 * needs at least two options to pick between. A list is a menu unless it is
 * empty (nothing to show), draws a mark per option (only a sheet can, whatever
 * its length), asks for a presentation outright, or reaches the sheet
 * threshold.
 */
export function filterShape<T extends object>(filter: FilterType<T>): FilterShape {
	switch (filter.type) {
		case 'toggle':
			return 'inline'

		case 'picker':
			return filter.spec.options.length < 2 ? 'none' : 'menu'

		case 'list': {
			let {options, renderMark, presentation} = filter.spec

			if (options.length === 0) {
				return 'none'
			}
			// A mark overrides even an explicit `presentation`: it is a view, and
			// a pull-down menu has nowhere to draw one, so asking for a menu
			// would silently drop it.
			if (renderMark) {
				return 'sheet'
			}
			if (presentation) {
				return presentation
			}
			return options.length >= SHEET_THRESHOLD ? 'sheet' : 'menu'
		}

		default:
			return 'none'
	}
}
