// @flow
import type {FilterSpecType} from '../../components/filter'
import type {MenuItemContainerType, MasterCorIconMapType} from '../types'
import {trimStationName} from '../lib/trim-names'
import uniq from 'lodash/uniq'
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

  // Extract the station names from the food items,
  // and clean them up
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

  // Grab the labels of the COR icons
  let allDietaryRestrictions = map(corIcons, item => item.label)
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
