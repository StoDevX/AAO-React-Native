// @flow

import React from 'react'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'
import {menuBaseUrl, cafeBaseUrl} from '../data'

import type {BonAppResponseType, StationMenuType, MenuItemContainerType} from '../types'

export default class CageMenuView extends React.Component {
  static propTypes = {
    cafeId: React.PropTypes.string.isRequired,
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
    stationsToCreate: string[],
  };

  componentDidMount() {
    this.fetchData()
  }

  props: {
    cafeId: string,
  }

  fetchData = async () => {
    let responseData: BonAppMenuInfoType = await fetch(menuBaseUrl + this.props.cafeId).then(response => response.json())
    let whichMeal = 0

    // console.warn(this.props.cafeId, JSON.stringify(responseData.days))

    let foodItems = responseData.items
    let dayparts = responseData.days[0].cafes[this.props.cafeId].dayparts
    let stationMenus = []
    if (dayparts.length && dayparts[0].length) {
      stationMenus = dayparts[0][whichMeal].stations
    }

    let stationsToCreate = [
      // 'Breakfast',
      // 'Bakery',
      // 'Burgers and Sandwiches',
      'Ice Cream',
      'Smoothies',
      // 'Hot Beverages',
    ].map(label => `<strong>@${label}</strong>`)

    this.setState({stationMenus, foodItems, stationsToCreate, loading: false})
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text='Checking for vegan cookies…' />
    }

    if (!this.state.stationMenus.length) {
      return <LoadingView text='No Moar Foodz we r sorry —Randy' />
    }

    return (
      <FancyMenu
        stationMenus={this.state.stationMenus}
        foodItems={this.state.foodItems}
        stationsToCreate={this.state.stationsToCreate}
      />
    )
  }
}
