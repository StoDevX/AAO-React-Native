// @flow
import React from 'react'
import {View, Navigator} from 'react-native'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'
import {FilterToolbar} from '../filter/toolbar'

import type {TopLevelViewPropsType} from '../../types'
import {TopLevelViewPropTypes} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import uniq from 'lodash/uniq'
import values from 'lodash/values'
import map from 'lodash/map'

import type {
  StationMenuType,
  MenuItemContainerType,
} from '../types'

import defaultPauseMenu from '../../../data/pause-bonapp.json'
(defaultPauseMenu: {stations: StationMenuType[], items: MenuItemContainerType})

import type {FilterSpecType} from '../filter/types'

export default class PauseMenuView extends React.Component {
  static propTypes = {
    loadingMessage: React.PropTypes.string.isRequired,
    ...TopLevelViewPropTypes,
  }

  state: {
    loading: boolean,
    menus: StationMenuType[],
    foodItems: MenuItemContainerType,
    message: string|null,
    isFiltered: bool,
    filters: FilterSpecType[],
  } = {
    loading: true,
    menus: [],
    foodItems: {},
    message: null,
    isFiltered: false,
    filters: [],
  }

  componentDidMount() {
    const now = moment.tz(CENTRAL_TZ)
    this.fetchData(now)
  }

  props: TopLevelViewPropsType & {
    loadingMessage: string,
  }

  trimStationName(stationName: string) {
    return stationName.replace(/<strong>@(.*)<\/strong>/, '$1')
  }

  fetchData = async (now: momentT) => {
    let cafeMenu = defaultPauseMenu

    let foodItems = cafeMenu.items
    let menus = cafeMenu.stations

    let filters = []
    filters.push({
      type: 'toggle',
      key: 'specials',
      label: 'Only Specials',
      caption: 'Allows you to either see only the "specials" for today, or everything the location has to offer, including condiments and salad fixings.',
      value: false,
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

    let allDietaryRestrictions = values(cafeMenu.cor_icons).map(item => item.label)
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

    this.setState({menus, foodItems, filters, loading: false})
  }

  openFilterView = () => {
    this.props.navigator.push({
      id: 'MenusFilterView',
      index: this.props.route.index + 1,
      title: 'Filter',
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
      onDismiss: this.closeFilterView,
      props: {
        filters: this.state.filters,
        onChange: this.onFiltersChanged,
      },
    })
  }

  closeFilterView = (route: any, navigator: any) => {
    navigator.pop()
  }

  onFiltersChanged = (newFilters: FilterSpecType[]) => {
    this.setState({filters: newFilters})
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text={this.props.loadingMessage} />
    } else if (this.state.message) {
      return <LoadingView text={this.state.message} />
    } else if (!this.state.menus.length) {
      return <LoadingView text='No Moar Foodz we r sorry —The CoCos' />
    }

    const now = moment.tz(CENTRAL_TZ)
    return (
      <View style={{flex: 1}}>
        <FilterToolbar
          date={now}
          title='Lunch'
          appliedFilterCount={this.state.filters.filter(f => f.type === 'toggle' ? f.value : f.value.length > 0).length}
          onPress={this.openFilterView}
        />
        <FancyMenu
          stationMenus={this.state.menus}
          foodItems={this.state.foodItems}
          filters={this.state.filters}
          stationsToCreate={[]}
        />
      </View>
    )
  }
}
