import type {ListItemSpecType} from '../types'

/**
 * The text a list filter's option row draws.
 *
 * Most filters name an option by its title. The ones built from a code -- the
 * course catalog's departments, say -- carry the spelt-out name in `label` and
 * turn `displayTitle` off, so the reader sees Biology rather than BIO.
 *
 * `label` is optional, and a filter that turns titles off is asking for a name
 * it may not hold for every option. The title is what those fall back to: a
 * row drawing `BIO` is worse than one drawing Biology, but a row drawing
 * nothing cannot be chosen at all.
 */
export function optionLabel(option: ListItemSpecType, displayTitle: boolean): string {
	if (displayTitle) {
		return option.title
	}

	return option.label ?? option.title
}
