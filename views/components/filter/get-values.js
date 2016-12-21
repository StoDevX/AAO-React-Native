// @flow
import type {FilterSpecType} from './types'
import difference from 'lodash/difference'

// Given a filter-list, return the actually selected ones. We have a list of
// all possibilities, and a list of the one the user _doesn't_ want to see, so
// we're eliminating those that the user de-selected.
export function getSelectedValuesFromListFilter(filter: ?FilterSpecType): any[]|null {
  if (filter && filter.type === 'list') {
    return difference(filter.options, filter.value)
  }
  return null
}
