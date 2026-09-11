import type {ListItemSpecType} from '../types'

/**
 * The text a list filter's option row draws.
 *
 * Most filters name an option by its title. The ones built from a code -- the
 * course catalog's departments, say -- carry the spelt-out name in `label` and
 * turn `displayTitle` off, so the reader sees Biology rather than BIO.
 */
export function optionLabel(option: ListItemSpecType, displayTitle: boolean): string | undefined {
	return displayTitle ? option.title : option.label
}
