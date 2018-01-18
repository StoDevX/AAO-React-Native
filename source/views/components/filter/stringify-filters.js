/**
 * @flow
 * Stringify a set of filters for transfer to GA.
 * (because we really don't need to ship those descriptions over the network)
 */
import type {FilterType, ListType} from './types'

export function stringifyFilters(filters: FilterType[]): string {
	return filters.map(f => stringifyFilter(f)).join('; ')
}

function stringifyFilter(filter: FilterType): string {
	let spec = 'n/a'

	if (filter.type === 'list') {
		spec = stringifyListFilter(filter)
	} else if (filter.type === 'picker') {
		spec = filter.spec.selected
	}

	return JSON.stringify({
		key: filter.key,
		type: filter.type,
		enabled: filter.enabled,
		spec: spec,
	})
}

function stringifyListFilter(filter: ListType): string {
	// Extract the list of "selected" items
	const filterValue = filter.spec.selected
	return filterValue.map(f => f.title).join(', ')
}
