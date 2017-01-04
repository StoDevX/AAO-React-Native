// @flow
import React from 'react'
import {View} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import type {MenuItemType, MasterCorIconMapType, StationMenuType} from '../types'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import fromPairs from 'lodash/fromPairs'
import filter from 'lodash/filter'
import {MenuListView} from './menu'

type FancyMenuPropsType = TopLevelViewPropsType & {
  now: momentT,
  name: string,
  foodItems: MenuItemType[],
  menuLabel?: string,
  menuCorIcons: MasterCorIconMapType,
  stationMenus: StationMenuType[],
};

// We're disabling the stateless-function check for a short while. Only until
// the next PR comes in, as it requires state. This will make the diff
// smaller.
// eslint-disable-next-line react/prefer-stateless-function
export class FancyMenu extends React.Component {
  props: FancyMenuPropsType;

  render() {
    const {foodItems, stationMenus} = this.props

    const stationNotes = fromPairs(stationMenus.map(m => [m.label, m.note]))
    const stationsSort = stationMenus.map(m => m.label)

    // only show items that the menu lists today
    const filtered = filter(foodItems, item => stationsSort.includes(item.station))
    // sort the remaining items by station
    const sortedByStation = sortBy(filtered, item => stationsSort.indexOf(item.station))
    // group them for the ListView
    const grouped = groupBy(sortedByStation, item => item.station)

    return (
      <View style={{flex: 1}}>
        <MenuListView data={grouped} stationNotes={stationNotes} badgeSpecials />
      </View>
    )
  }
}
