// @flow
import React from 'react'
import {View, Navigator} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import type {MenuItemType, MasterCorIconMapType} from '../types'
import type {FilterSpecType} from '../../components/filter'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {FilterMenuToolbar} from './filter-menu-toolbar'
import {MenuListView} from './menu'
import {applyFilters} from '../lib/apply-filters'
import {buildMenuFilters} from '../lib/build-menu-filters'
import {trimStationName, trimItemLabel} from '../lib/trim-names'

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
    let filters = buildMenuFilters({foodItems, corIcons: menuCorIcons})
    this.setState({filters})
  }

  props: TopLevelViewPropsType & {
    applyFilters: (items: MenuItemType[], filters: FilterSpecType[]) => MenuItemType[],
    now: momentT,
    foodItems: MenuItemType[],
    menuLabel?: string,
    menuCorIcons: MasterCorIconMapType,
  }

  openFilterView = () => {
    this.props.navigator.push({
      id: 'FilterView',
      index: this.props.route.index + 1,
      title: 'Filter',
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
      onDismiss: (route: any, navigator: any) => navigator.pop(),
      props: {
        filters: this.state.filters,
        onChange: (newFilters: FilterSpecType[]) => this.setState({filters: newFilters}),
      },
    })
  }

  render() {
    let {foodItems, now, menuLabel} = this.props
    let {filters} = this.state

    // get all the food
    let allMenuItems = foodItems.map(item => ({
      ...item,  // we want to edit the item, not replace it
      station: trimStationName(item.station),  // station names are a mess
      label: trimItemLabel(item.label),  // clean up the titles
    }))

    // apply the selected filters, then sort the list of menu items, then
    // group them for the ListView
    let filtered = applyFilters(allMenuItems, filters)
    let sorted = sortBy(filtered, [item => item.station, item => item.id])
    let grouped = groupBy(sorted, item => item.station)

    return (
      <View style={{flex: 1}}>
        <FilterMenuToolbar
          date={now}
          title={menuLabel}
          filters={filters}
          onPress={this.openFilterView}
        />
        <MenuListView data={grouped} />
      </View>
    )
  }
}
