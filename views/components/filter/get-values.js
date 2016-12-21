// @flow
import type {FilterSpecType} from './types'
import difference from 'lodash/difference'

// Given a filter-list, return the actually selected ones.
export function getSelectedValuesFromListFilter(filter: ?FilterSpecType): any[]|null {
  if (filter && filter.type === 'list') {
    return difference(filter.options, filter.value)
  }
  return null
}
