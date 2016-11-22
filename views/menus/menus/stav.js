// @flow
import React from 'react'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

import type {BonAppResponseType, StationMenuType, MenuItemContainerType} from '../types'
import buildingHours from '../../../data/building-hours.json'

export default class StavMenuView extends React.Component {
  static propTypes = {
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
  }

  getTodaysLunchHours(currentDay: 'mo'|'tu'|'we'|'th'|'fr'|'sa'|'su') {
    let buildingInfo = buildingHours.find(building => building.name === 'Stav Hall Lunch')
    return buildingInfo.times.hours[currentDay][1]
  }

  whichMeal(): 1|2 {
    let current = moment().tz(CENTRAL_TZ)
    let currentTime = current.format('H:mm')
    let lunchClose = this.getTodaysLunchHours(current.format('ddd'))

    return (currentTime < lunchClose)
      ? 1
      : 2
  }

  fetchData = async () => {
    let responseData: BonAppResponseType = await fetch(this.props.menuUrl).then(response => response.json())
    let whichMeal = this.whichMeal()

    let foodItems = responseData.items
    let dayParts = responseData.days[0].cafes['261'].dayparts
    let stationMenus = []
    if (dayParts.length && dayParts[0].length) {
      stationMenus = dayParts[0][whichMeal].stations
    }

    this.setState({stationMenus, foodItems, loading: false})
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text='Hunting Ferndale Turkey…' />
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
