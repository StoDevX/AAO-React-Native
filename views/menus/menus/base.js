// @flow
import React from 'react'
import {View, Navigator, Platform} from 'react-native'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'
import {FilterToolbar} from '../filter/toolbar'

import type {TopLevelViewPropsType} from '../../types'
import {TopLevelViewPropTypes} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import findIndex from 'lodash/findIndex'
import uniq from 'lodash/uniq'
import values from 'lodash/values'
import map from 'lodash/map'

import type {
  BonAppMenuInfoType,
  StationMenuType,
  MenuItemContainerType,
  DayPartMenuType,
  DayPartsCollectionType,
  BonAppCafeInfoType,
} from '../types'

import type {FilterSpecType} from '../filter/types'


export class BaseMenuView extends React.Component {
  static propTypes = {
    cafeId: React.PropTypes.string.isRequired,
    cafeInfo: React.PropTypes.object.isRequired,
    cafeMenu: React.PropTypes.object.isRequired,
    now: React.PropTypes.instanceOf(moment).isRequired,
    ...TopLevelViewPropTypes,
  }

  state: {|
    menus: StationMenuType[],
    foodItems: MenuItemContainerType,
    message: string|null,
    isFiltered: bool,
    filters: FilterSpecType[],
    mealName: string,
  |} = {
    menus: [],
    foodItems: {},
    message: null,
    isFiltered: false,
    mealName: '',
    filters: [],
  }

  componentDidMount() {
    this.parseData()
  }

  props: TopLevelViewPropsType & {
    cafeId: string,
    cafeInfo: BonAppCafeInfoType,
    cafeMenu: BonAppMenuInfoType,
    now: momentT,
  }

  findMenu(dayparts: DayPartsCollectionType, now: momentT): void|DayPartMenuType {
    if (!dayparts.length || !dayparts[0].length) {
      return
    }

    if (dayparts[0].length === 1) {
      return dayparts[0][0]
    }

    const times = dayparts[0].map(({starttime, endtime}) => ({
      startTime: moment.tz(starttime, 'H:mm', true, CENTRAL_TZ),
      endTime: moment.tz(endtime, 'H:mm', true, CENTRAL_TZ),
    }))

    let mealIndex = findIndex(times, ({startTime, endTime}) => now.isBetween(startTime, endTime))
    if (mealIndex === undefined) {
      if (now.isSameOrBefore(times[0].startTime)) {
        mealIndex = 0
      } else {
        mealIndex = times.length - 1
      }
    }

    return dayparts[0][mealIndex]
  }

  trimStationName(stationName: string) {
    return stationName.replace(/<strong>@(.*)<\/strong>/, '$1')
  }

  parseData = async () => {
    let {cafeId, cafeMenu, cafeInfo, now} = this.props

    let days = cafeInfo.cafes[cafeId].days
    let today = days.find(({date}) => date === now.format('YYYY-MM-DD'))
    if (!today || today.status === 'closed') {
      this.setState({message: today ? today.message : 'Closed today'})
      return
    }

    let foodItems = cafeMenu.items
    let dayparts = cafeMenu.days[0].cafes[cafeId].dayparts
    let mealInfo = this.findMenu(dayparts, now)
    let menus = mealInfo ? mealInfo.stations : []
    let mealName = mealInfo ? mealInfo.label : ''

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

    this.setState({menus, mealName, foodItems, filters})
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
    if (this.state.message) {
      return <LoadingView text={this.state.message} />
    }

    return (
      <View style={{flex: 1, marginBottom: Platform.OS === 'ios' ? 49 : 0}}>
        <FilterToolbar
          date={this.props.now}
          title={this.state.mealName}
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
