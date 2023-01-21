/**
 * @flow
 * Stringify a set of filters for transfer to GA.
 * (because we really don't need to ship those descriptions over the network)
 */
import type {FilterType, ListType} from './types'

export function stringifyFilters<T extends object>(
	filters: FilterType<T>[],
): string {
	return filters.map((f) => stringifyFilter(f)).join('; ')
}

function stringifyFilter<T extends object>(filter: FilterType<T>): string {
	let spec = 'n/a'

	if (filter.type === 'list') {
		spec = stringifyListFilter(filter)
	} else if (filter.type === 'picker') {
		if (filter.spec.selected) {
			spec = filter.spec.selected.label
		}
	}

	return JSON.stringify({
		key: filter.key,
		type: filter.type,
		enabled: filter.enabled,
		spec: spec,
	})
}

function stringifyListFilter<T extends object>(filter: ListType<T>): string {
	// Extract the list of "selected" items
	let filterValue = filter.spec.selected
	return filterValue.map((f) => f.title).join(', ')
}
