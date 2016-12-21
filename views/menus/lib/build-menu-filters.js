// @flow
import type {FilterSpecType} from '../filter/types'
import type {MenuItemContainerType, MasterCorIconMapType} from '../types'
import {trimStationName} from '../lib/trim-names'
import uniq from 'lodash/uniq'
import values from 'lodash/values'
import map from 'lodash/map'

export function buildMenuFilters({foodItems, corIcons}: {foodItems: MenuItemContainerType, corIcons: MasterCorIconMapType}): FilterSpecType[] {
  let filters = []
  filters.push({
    type: 'toggle',
    key: 'specials',
    label: 'Only Specials',
    caption: 'Allows you to either see only the "specials" for today, or everything the location has to offer, including condiments and salad fixings.',
    value: true,
  })

  let allStations = uniq(map(foodItems, item => item.station)).map(trimStationName)
  filters.push({
    type: 'list',
    multiple: true,
    key: 'stations',
    title: 'Stations',
    booleanKind: 'NOR',
    caption: 'a caption',
    options: allStations,
    value: [],
  })

  let allDietaryRestrictions = values(corIcons).map(item => item.label)
  filters.push({
    type: 'list',
    multiple: true,
    key: 'restrictions',
    title: 'Dietary Restrictions',
    booleanKind: 'NOR',
    caption: 'a nother caption',
    options: allDietaryRestrictions,
    value: [],
  })

  return filters
}
