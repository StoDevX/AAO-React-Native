// @flow
import React from 'react'
import {View} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import type {MenuItemType, MasterCorIconMapType, StationMenuType} from '../types'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import fromPairs from 'lodash/fromPairs'
import mapValues from 'lodash/mapValues'
import {MenuListView} from './menu'
import {trimStationName, trimItemLabel} from '../lib/trim-names'

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
    let {foodItems, stationMenus} = this.props

    let stationNotes = fromPairs(stationMenus.map(m => [m.label, m.note]))

    // get all the food
    let allMenuItems = foodItems.map(item => ({
      ...item,  // we want to edit the item, not replace it
      station: trimStationName(item.station),  // <b>@station names</b> are a mess
      label: trimItemLabel(item.label),  // clean up the titles
    }))

    // apply the selected filters, then group them for the ListView, then sort
    // each list of menu items
    let grouped = groupBy(allMenuItems, item => item.station)
    let sorted = mapValues(grouped, items => sortBy(items, item => item.id))

    return (
      <View style={{flex: 1}}>
        <MenuListView data={sorted} stationNotes={stationNotes} badgeSpecials />
      </View>
    )
  }
}
