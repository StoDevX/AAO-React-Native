// @flow
import type {FilterType, ToggleType, ListType, ListItemSpecType} from './types'
import values from 'lodash/values'
import difference from 'lodash/difference'

export function applyFiltersToItem(filters: FilterType[], item: any): boolean {
  // Given a list of filters, return the result of running all of those
  // filters over the item
  return filters.every(f => applyFilter(f, item))
}

export function applyFilter(filter: FilterType, item: any): boolean {
  // if the filter is disabled, we don't want to filter at all, so we return
  // `true` for every item
  if (!filter.enabled) {
    return true
  }

  // otherwise, we apply the appropriate filter to the item
  switch (filter.type) {
    case 'toggle':
      return applyToggleFilter(filter, item)
    case 'list':
      return applyListFilter(filter, item)
    default:
      return true
  }
}

export function applyToggleFilter(filter: ToggleType, item: any): boolean {
  // Dereference the value-to-check
  const itemValue = item[filter.apply.key]
  return Boolean(itemValue)
}

export function applyListFilter(filter: ListType, item: any): boolean {
  // Dereference the value-to-check
  const itemValue = item[filter.apply.key]
  // Extract the list of "selected" items
  const filterValue = filter.spec.selected

  switch (filter.spec.mode) {
    case 'OR':
      return applyOrListFilter(filterValue, itemValue)
    case 'AND':
      return applyAndListFilter(filterValue, itemValue)
    default:
      return true
  }
}

export function applyOrListFilter(
  filterValue: ListItemSpecType[],
  itemValue: string,
): boolean {
  // An item passes, if its value is in the filter's selected items array
  return filterValue.map(f => f.title).includes(itemValue)
}

export function applyAndListFilter(
  filterValue: ListItemSpecType[],
  itemValue: string[] | {[key: string]: string},
): boolean {
  // In case the value is an object, instead of an array, convert it to an array
  if (!Array.isArray(itemValue)) {
    itemValue = values(itemValue)
  }

  // If there are no items, it cannot contain the item we're filtering by.
  if (!itemValue.length) {
    return false
  }

  // Check that the number of different items between the two lists is 0, to
  // ensure that all of the restrictions we're seeking are present.
  const valueToCheckAgainst = filterValue.map(f => f.title)
  const differentItems = difference(valueToCheckAgainst, itemValue)
  return differentItems.length === 0
}
