// @flow
import React from 'react'
import {View} from 'react-native'
import {connect} from 'react-redux'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import type {MenuItemType, MasterCorIconMapType, StationMenuType} from '../types'
import type {FilterType} from '../../components/filter'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import fromPairs from 'lodash/fromPairs'
import filter from 'lodash/filter'
import {MenuListView} from './menu'

type FancyMenuPropsType = TopLevelViewPropsType & {
  now: momentT,
  name: string,
  filters: FilterType[],
  foodItems: MenuItemType[],
  menuLabel?: string,
  menuCorIcons: MasterCorIconMapType,
  stationMenus: StationMenuType[],
};

class FancyMenuView extends React.Component {
  props: FancyMenuPropsType;

  render() {
    const {
      foodItems,
      stationMenus,
    } = this.props

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

function mapStateToProps(state, actualProps: FancyMenuPropsType) {
  return {
    filters: state.menus[actualProps.name] || [],
  }
}

export const FancyMenu = connect(mapStateToProps)(FancyMenuView)
