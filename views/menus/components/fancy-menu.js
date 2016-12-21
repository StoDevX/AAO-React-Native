// @flow
import React from 'react'
import {View, Navigator} from 'react-native'
import {FilterToolbar} from '../filter/toolbar'

import uniqBy from 'lodash/uniqBy'
import identity from 'lodash/identity'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {trimStationName, trimItemLabel} from '../lib/trim-names'
import {MenuListView} from './menu'
import {applyFilters} from '../lib/apply-filters'
import {buildMenuFilters} from '../lib/build-menu-filters'

import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import values from 'lodash/values'

import type {
  MenuItemContainerType,
  MenuItemType,
  StationMenuType,
  MasterCorIconMapType,
} from '../types'
import type {ProcessedMenuPropsType} from '../types'
import type {FilterSpecType} from '../filter/types'

export class FancyMenu extends React.Component {
  static defaultProps = {
    applyFilters: applyFilters,
  }

  state: {|
    filters: FilterSpecType[],
  |} = {
    filters: [],
  }

  componentWillMount() {
    let {foodItems, menuCorIcons} = this.props
    this.setState({filters: buildMenuFilters({foodItems, corIcons: menuCorIcons})})
  }

  props: TopLevelViewPropsType & {
    applyFilters: (items: MenuItemType[], filters: FilterSpecType[]) => MenuItemType[],
    now: momentT,
    stationMenus: StationMenuType[],
    foodItems: MenuItemContainerType,
    menuLabel?: string,
    menuCorIcons: MasterCorIconMapType,
  }

  openFilterView = () => {
    this.props.navigator.push({
      id: 'MenusFilterView',
      index: this.props.route.index + 1,
      title: 'Filter',
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
      onDismiss: (route: any, navigator: any) => navigator.pop(),
      props: {
        filters: this.state.filters,
        onChange: this.onFiltersChanged,
      },
    })
  }

  onFiltersChanged = (newFilters: FilterSpecType[]) => {
    this.setState({filters: newFilters})
  }

  flatten(accumulator: any[], current: any[]) {
    return accumulator.concat(current)
  }

  render() {
    let {props, state} = this

    // TODO: do we need menuItems and stationMenus anymore?

    // expand the mapping of menu item ids to retrieve the actual items.
    // we re-group the items later on.
    let menuItems = props.stationMenus
      // grab the items from the overall list
      .map(menu => menu.items.map(id => props.foodItems[id]))
      // flatten the menu arrays into one master menu
      .reduce(this.flatten, [])
      // and only return the items that were retrieved successfully
      .filter(identity)

    let otherMenuItems = values(props.foodItems)

    // prevent ourselves from returning duplicate items
    let allMenuItems = uniqBy([...menuItems, ...otherMenuItems], item => item.id)

    // clean up the station names
    allMenuItems = allMenuItems.map(item => ({...item, station: trimStationName(item.station)}))

    // apply the selected filters
    let filtered = props.applyFilters(allMenuItems, state.filters)

    // clean up the titles
    filtered = filtered.map(food => ({...food, label: trimItemLabel(food.label)}))

    // apply a sort to the list of menu items
    let sorted = sortBy(filtered, [item => item.station, item => item.id])

    let grouped: ProcessedMenuPropsType = groupBy(sorted, item => item.station)

    return (
      <View style={{flex: 1}}>
        <FilterToolbar
          date={this.props.now}
          title={this.props.menuLabel}
          filters={this.state.filters}
          onPress={this.openFilterView}
        />
        <MenuListView data={grouped} />
      </View>
    )
  }
}
