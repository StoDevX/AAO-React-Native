// @flow
import React from 'react'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'
import querystring from 'qs'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import findIndex from 'lodash/findIndex'
import {menuBaseUrl, cafeBaseUrl} from '../data'

import type {BonAppResponseType, StationMenuType, MenuItemContainerType, DayPartMenuType} from '../types'
import buildingHours from '../../../data/building-hours.json'
const fetchJson = (url, query) => fetch(`${url}?${querystring.stringify(query)}`).then(response => response.json())

export default class StavMenuView extends React.Component {
  static propTypes = {
    cafeId: React.PropTypes.string.isRequired,
    loadingMessage: React.PropTypes.string.isRequired,
  }

  state = {
    loading: true,
    stationMenus: [],
    foodItems: [],
    message: null,
  }

  state: {
    loading: boolean,
    stationMenus: StationMenuType[],
    foodItems: MenuItemContainerType,
    message: string|null,
  };

  componentDidMount() {
    const now = moment.tz(CENTRAL_TZ)
    this.fetchData(now)
  }

  props: {
    cafeId: string,
    loadingMessage: string,
  }

  findMenu(dayparts: DayPartsCollectionType, now: momentT): void|DayPartMenuType {
    if (!dayparts.length || !dayparts[0].length) {
      return
    }


    const times = dayparts[0].map(({starttime, endtime}) => ({
      startTime: moment.tz(starttime, 'H:mm', true, CENTRAL_TZ),
      endTime: moment.tz(endtime, 'H:mm', true, CENTRAL_TZ),
    }))

    const mealIndex = findIndex(times, ({startTime, endTime}) => now.isBetween(startTime, endTime))

    return dayparts[0][mealIndex]
  }

  fetchData = async (now: momentT) => {
    let requests = await Promise.all([
      fetchJson(menuBaseUrl, {cafe: this.props.cafeId}),
    ])

    let [
      cafeMenu: BonAppMenuInfoType,
    ] = requests

    let foodItems = cafeMenu.items
    let dayparts = cafeMenu.days[0].cafes[this.props.cafeId].dayparts
    let mealInfo = this.findMenu(dayparts, now)
    let stationMenus = mealInfo ? mealInfo.stations : []

    this.setState({stationMenus, foodItems, loading: false})
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text={this.props.loadingMessage} />
    }

    if (this.state.message) {
      return <LoadingView text={this.state.message} />
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
