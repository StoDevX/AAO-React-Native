// @flow
import type {FilterSpecType} from '../../components/filter'
import type {MenuItemType, MasterCorIconMapType} from '../types'
import {trimStationName} from '../lib/trim-names'
import uniq from 'lodash/uniq'
import map from 'lodash/map'

export function buildMenuFilters({foodItems, corIcons}: {foodItems: MenuItemType[], corIcons: MasterCorIconMapType}): FilterSpecType[] {
  let filters = []

  filters.push({
    key: 'specials',
    type: 'toggle',
    label: 'Only Specials',
    caption: 'Allows you to either see only the "specials" for today, or everything the location has to offer, including condiments and salad fixings.',
    value: true,
  })

  // Extract the station names from the food items,
  // and clean them up
  let allStations = uniq(map(foodItems, item => item.station)).map(trimStationName)
  filters.push({
    key: 'stations',
    type: 'list',
    multiple: true,
    title: 'Stations',
    options: allStations,
    value: [],
  })

  // Grab the labels of the COR icons
  let allDietaryRestrictions = map(corIcons, item => item.label)
  filters.push({
    key: 'restrictions',
    type: 'list',
    multiple: true,
    title: 'Dietary Restrictions',
    options: allDietaryRestrictions,
    value: [],
  })

  return filters
}
