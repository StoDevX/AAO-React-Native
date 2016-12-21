// @flow
import type {MenuItemType} from '../types'
import type {FilterSpecType} from '../../components/filter'
import {getSelectedValuesFromListFilter} from '../../components/filter'
import difference from 'lodash/difference'
import includes from 'lodash/includes'
import filter from 'lodash/filter'
import values from 'lodash/values'

export function applyFilters(items: MenuItemType[], filters: FilterSpecType[]): MenuItemType[] {
  items = applySpecialsFilter(items, filters)
  items = applyStationsFilter(items, filters)
  items = applyDietaryFilter(items, filters)
  return items
}

function applySpecialsFilter(items: MenuItemType[], filters: FilterSpecType[]): MenuItemType[] {
  let onlySpecialsFilter = filters.find(({key}) => key === 'specials')

  let onlySpecials = onlySpecialsFilter ? onlySpecialsFilter.value : false

  if (onlySpecials) {
    items = filter(items, item => item.special)
  }

  return items
}

function applyStationsFilter(items: MenuItemType[], filters: FilterSpecType[]): MenuItemType[] {
  let stationsFilter = filters.find(({key}) => key === 'stations')

  // given all of the stations, get just the list that we want. (becuase we
  // have a list of all possibilities, and a list of the one the user
  // _doesn't_ want to see)
  let onlyTheseStations = getSelectedValuesFromListFilter(stationsFilter)

  if (onlyTheseStations) {
    items = filter(items, item => includes(onlyTheseStations, item.station))
  }

  return items
}

function applyDietaryFilter(items: MenuItemType[], filters: FilterSpecType[]): MenuItemType[] {
  let dietaryRestrictionsFilter = filters.find(({key}) => key === 'restrictions')

  // given all of the dietary restrictions, get just the list that we want
  let onlyTheseDietaryRestrictions = getSelectedValuesFromListFilter(dietaryRestrictionsFilter)

  if (onlyTheseDietaryRestrictions) {
    items = filter(items, item => {
      let theseRestrictions = values(item.cor_icon)
      // If the item has no restrictions, it can't have the one we're
      // filtering by.
      if (!theseRestrictions.length) {
        return false
      }

      // Then we check that the number of different items between the two
      // lists is 0.
      let differentItems = difference(theseRestrictions, onlyTheseDietaryRestrictions)
      return differentItems.length === 0
    })
  }

  return items
}
