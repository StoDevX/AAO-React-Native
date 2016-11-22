// @flow
import React from 'react'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import findIndex from 'lodash/findIndex'

import type {BonAppResponseType, StationMenuType, MenuItemContainerType, DayPartMenuType} from '../types'
import buildingHours from '../../../data/building-hours.json'

export default class StavMenuView extends React.Component {
  static propTypes = {
    cafeId: React.PropTypes.string.isRequired,
    menuUrl: React.PropTypes.string.isRequired,
  }

  state = {
    loading: true,
    stationMenus: [],
    foodItems: [],
  }

  state: {
    loading: boolean,
    stationMenus: StationMenuType[],
    foodItems: MenuItemContainerType,
  };

  componentDidMount() {
    this.fetchData()
  }

  props: {
    menuUrl: string,
    cafeId: string,
  }

  whichMeal(dayparts: Array<Array<DayPartMenuType>>): void|DayPartMenuType {
    if (!dayparts.length || !dayparts[0].length) {
      return
    }

    const current = moment.tz(CENTRAL_TZ)

    const times = dayparts[0].map(({starttime, endtime}) => ({
      startTime: moment.tz(starttime, 'H:mm', true, CENTRAL_TZ),
      endTime: moment.tz(endtime, 'H:mm', true, CENTRAL_TZ),
    }))

    const mealIndex = findIndex(times, ({startTime, endTime}) => current.isBetween(startTime, endTime))

    return dayparts[0][mealIndex]
  }

  fetchData = async () => {
    let responseData: BonAppResponseType = await fetch(this.props.menuUrl).then(response => response.json())

    let foodItems = responseData.items
    let dayparts = responseData.days[0].cafes[this.props.cafeId].dayparts
    let mealInfo = this.whichMeal(dayparts)
    let stationMenus = []
    if (mealInfo) {
      stationMenus = mealInfo.stations
    }

    this.setState({stationMenus, foodItems, loading: false})
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text='Hunting Ferndale Turkey…' />
    }

    if (!this.state.stationMenus.length) {
      return <LoadingView text='No Moar Foodz we r sorry —Randy' />
    }

    return (
      <FancyMenu
        stationMenus={this.state.stationMenus}
        foodItems={this.state.foodItems}
        stationsToCreate={[]}
      />
    )
  }
}
