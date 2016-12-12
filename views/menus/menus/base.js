// @flow
import React from 'react'
import {View, Navigator, Platform} from 'react-native'
import FancyMenu from '../parts/fancy-menu'
import {FilterToolbar} from '../filter/toolbar'

import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import uniq from 'lodash/uniq'
import values from 'lodash/values'
import map from 'lodash/map'

import type {
  StationMenuType,
  MenuItemContainerType,
  MasterCorIconMapType,
} from '../types'

import type {FilterSpecType} from '../filter/types'

export class BaseMenuView extends React.Component {
  state: {|
    filters: FilterSpecType[],
  |} = {
    filters: [],
  }

  componentDidMount() {
    this.buildFilters()
  }

  props: TopLevelViewPropsType & {
    now: momentT,
    stationMenus: StationMenuType[],
    foodItems: MenuItemContainerType,
    menuLabel: string,
    menuCorIcons: MasterCorIconMapType,
  }

  trimStationName(stationName: string) {
    return stationName.replace(/<strong>@(.*)<\/strong>/, '$1')
  }

  buildFilters = () => {
    let {foodItems, menuCorIcons} = this.props

    let filters = []
    filters.push({
      type: 'toggle',
      key: 'specials',
      label: 'Only Specials',
      caption: 'Allows you to either see only the "specials" for today, or everything the location has to offer, including condiments and salad fixings.',
      value: true,
    })

    let allStations = uniq(map(foodItems, item => item.station)).map(this.trimStationName)
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

    let allDietaryRestrictions = values(menuCorIcons).map(item => item.label)
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

    this.setState({filters})
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

  render() {
    return (
      <View style={{flex: 1}}>
        <FilterToolbar
          date={this.props.now}
          title={this.props.menuLabel}
          appliedFilterCount={this.state.filters.filter(f => f.type === 'toggle' ? f.value : f.value.length > 0).length}
          onPress={this.openFilterView}
        />
        <FancyMenu
          stationMenus={this.props.stationMenus}
          foodItems={this.props.foodItems}
          filters={this.state.filters}
          stationsToCreate={[]}
        />
      </View>
    )
  }
}
