// @flow

import React from 'react'
import LoadingView from '../../components/loading'
import FancyMenu from '../parts/fancy-menu'

import type {BonAppResponseType, StationMenuType, MenuItemContainerType} from '../types'

export default class CageMenuView extends React.Component {
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
    stationsToCreate: string[],
  };

  componentDidMount() {
    this.fetchData()
  }

  props: {
    menuUrl: string,
    cafeId: string,
  }

  fetchData = async () => {
    let responseData: BonAppResponseType = await fetch(this.props.menuUrl).then(response => response.json())
    let whichMeal = 0

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

    return (
      <FancyMenu
        stationMenus={this.state.stationMenus}
        foodItems={this.state.foodItems}
        stationsToCreate={this.state.stationsToCreate}
      />
    )
  }
}
