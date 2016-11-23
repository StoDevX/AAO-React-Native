// @flow
import React from 'react'
import {View, Navigator} from 'react-native'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'
import {FilterToolbar} from '../filter/toolbar'
import querystring from 'qs'

import type {TopLevelViewPropsType} from '../../types'
import {TopLevelViewPropTypes} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import findIndex from 'lodash/findIndex'
import {menuBaseUrl, cafeBaseUrl} from '../data'

import type {
  BonAppMenuInfoType,
  StationMenuType,
  MenuItemContainerType,
  DayPartMenuType,
  DayPartsCollectionType,
  BonAppCafeInfoType,
} from '../types'

import type {FilterSpecType, ToggleSpecType, SelectSpecType} from '../filter/types'

const fetchJson = (url, query) => fetch(`${url}?${querystring.stringify(query)}`).then(response => response.json())

const t1: ToggleSpecType = {
  type: 'toggle',
  key: 'specials',
  label: 'Only Specials',
  caption: 'Allows you to either see only the "specials" for today, or everything the location has to offer, including condiments and salad fixings.',
  value: false,
}
const l1: SelectSpecType = {
  type: 'list',
  multiple: true,
  key: 'stations',
  title: 'Stations',
  booleanKind: 'NOR',
  caption: 'a caption',
  options: [
    'Home',
    'Bowls',
    'Pizza',
    'Grains',
    'Tortilla',
    'Pasta',
    'Grill',
  ],
  value: [],
}
const l2: SelectSpecType = {
  type: 'list',
  multiple: true,
  key: 'restrictions',
  title: 'Dietary Restrictions',
  booleanKind: 'NOR',
  caption: 'a nother caption',
  options: [
    'Vegetarian',
    'Seafood Watch',
    'Vegan',
    'For Your Well-Being',
    'Farm to Fork',
    'In Balance',
    'Made Without Gluten-Containing Ingredients',
    'Kosher',
  ],
  value: [],
}

const defaultFilters: FilterSpecType[] = [
  t1,
  l1,
  l2,
]

export default class StavMenuView extends React.Component {
  static propTypes = {
    cafeId: React.PropTypes.string.isRequired,
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
    filters: defaultFilters,
  }

  // componentDidMount() {
  //   const now = moment.tz(CENTRAL_TZ)
  //   this.fetchData(now)
  // }

  props: {
    cafeId: string,
    loadingMessage: string,
  } & TopLevelViewPropsType

  // findMenu(dayparts: DayPartsCollectionType, now: momentT): void|DayPartMenuType {
  //   if (!dayparts.length || !dayparts[0].length) {
  //     return
  //   }

  //   if (dayparts[0].length === 1) {
  //     return dayparts[0][0]
  //   }

  //   const times = dayparts[0].map(({starttime, endtime}) => ({
  //     startTime: moment.tz(starttime, 'H:mm', true, CENTRAL_TZ),
  //     endTime: moment.tz(endtime, 'H:mm', true, CENTRAL_TZ),
  //   }))

  //   const mealIndex = findIndex(times, ({startTime, endTime}) => now.isBetween(startTime, endTime))

  //   return dayparts[0][mealIndex]
  // }

  // fetchData = async (now: momentT) => {
  //   let requests = await Promise.all([
  //     fetchJson(menuBaseUrl, {cafe: this.props.cafeId}),
  //     fetchJson(cafeBaseUrl, {cafe: this.props.cafeId}),
  //   ])

  //   let [
  //     cafeMenu: BonAppMenuInfoType,
  //     cafeInfo: BonAppCafeInfoType,
  //   ] = requests

  //   let days = cafeInfo.cafes[this.props.cafeId].days
  //   let today = days.find(({date}) => date === now.format('YYYY-MM-DD'))
  //   if (today.status === 'closed') {
  //     this.setState({loading: false, message: today.message})
  //     return
  //   }

  //   let foodItems = cafeMenu.items
  //   let dayparts = cafeMenu.days[0].cafes[this.props.cafeId].dayparts
  //   let mealInfo = this.findMenu(dayparts, now)
  //   let menus = mealInfo ? mealInfo.stations : []

  //   this.setState({menus, foodItems, loading: false})
  // }

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
    console.log('new filters', newFilters)
  }

  render() {
    let content = null

    content = <LoadingView text={this.props.loadingMessage} />
    // if (this.state.loading) {
    // } else if (this.state.message) {
    //   content = <LoadingView text={this.state.message} />
    // } else if (!this.state.menus.length) {
    //   content = <LoadingView text='No Moar Foodz we r sorry —Randy' />
    // } else {
    //   content = (
    //     <FancyMenu
    //       stationMenus={this.state.menus}
    //       foodItems={this.state.foodItems}
    //       stationsToCreate={[]}
    //     />
    //   )
    // }

    const now = moment.tz(CENTRAL_TZ)

    return (
      <View style={{flex: 1}}>
        <FilterToolbar
          date={now}
          title='Lunch'
          isFiltered={this.state.filters.map(f => f.type === 'toggle' ? f.value : f.value.length > 0).some(x => x)}
          onPress={this.openFilterView}
        />
        {content}
      </View>
    )
  }
}
