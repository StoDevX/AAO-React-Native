// @flow
import type {MenuItemType} from '../types'
import type {FilterSpecType} from '../../components/filter'
import difference from 'lodash/difference'
import includes from 'lodash/includes'
import filter from 'lodash/filter'
import values from 'lodash/values'

export function applyFilters(items: MenuItemType[], filters: FilterSpecType[]): MenuItemType[] {
  // console.log('applyFilters called')
  // console.log(items)

  items = applySpecialsFilter(items, filters)
  // console.log(items)

  items = applyStationsFilter(items, filters)
  // console.log(items)

  items = applyDietaryFilter(items, filters)
  // console.log(items)

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

  let onlyTheseStations = []
  if (stationsFilter && stationsFilter.type === 'list') {
    // given all of the stations, get just the list that we want
    // (becuase we have a list of all possibilities, and a list of the one the user _doesn't_ want to see)
    onlyTheseStations = difference(stationsFilter.options, stationsFilter.value)
  }

  if (onlyTheseStations.length) {
    items = filter(items, item => includes(onlyTheseStations, item.station))
  }

  return items
}

function applyDietaryFilter(items: MenuItemType[], filters: FilterSpecType[]): MenuItemType[] {
  let dietaryRestrictionsFilter = filters.find(({key}) => key === 'restrictions')

  let onlyTheseDietaryRestrictions = []
  if (dietaryRestrictionsFilter && dietaryRestrictionsFilter.type === 'list') {
    // given all of the dietary restrictions, get just the list that we want
    onlyTheseDietaryRestrictions = difference(dietaryRestrictionsFilter.options, dietaryRestrictionsFilter.value)
  }

  if (onlyTheseDietaryRestrictions.length) {
    items = filter(items, item => {
      let theseRestrictions = values(item.cor_icon)
      // If the item has no restrictions, it can't have the one we're
      // filtering by. Then we check that the number of different items
      // between the two lists is 0.
      return theseRestrictions.length && difference(theseRestrictions, onlyTheseDietaryRestrictions).length === 0
    })
  }

  return items
}
