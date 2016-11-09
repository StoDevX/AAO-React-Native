import React from 'react'
import LoadingView from '../components/loading'
import FancyMenu from './fancyMenu'

import type {BonAppResponseType, StationMenuType, MenuItemContainerType} from './types'

export default class CageMenuView extends React.Component {
  static menuUrl = 'http://legacy.cafebonappetit.com/api/2/menus?cafe=262'

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

  fetchData = async () => {
    let responseData: BonAppResponseType = await fetch(CageMenuView.menuUrl).then(response => response.json())
    let whichMeal = 0

    let stationMenus = responseData.days[0].cafes['262'].dayparts[0][whichMeal].stations
    let foodItems = responseData.items

    this.setState({stationMenus, foodItems, loading: false})
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text='Checking for vegan cookies…' />
    }

    return (
      <FancyMenu
        stationMenus={this.state.stationMenus}
        foodItems={this.state.foodItems}
      />
    )
  }
}
