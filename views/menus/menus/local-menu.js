// @flow
import React from 'react'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import type {StationMenuType, MenuItemContainerType, MasterCorIconMapType} from '../types'
import {
  stations as defaultStations,
  items as defaultItems,
  corIcons as defaultIcons,
} from '../../../data/pause-bonapp.js'
import {FilteredMenuView} from '../parts/filtered-menu'

export class LocalMenu extends React.Component {
  static defaultProps = {
    stationMenus: defaultStations,
    foodItems: defaultItems,
    corIcons: defaultIcons,
    now: moment.tz(CENTRAL_TZ),
  }

  props: TopLevelViewPropsType & {
    now: momentT,
    stationMenus: StationMenuType[],
    corIcons: MasterCorIconMapType,
    foodItems: MenuItemContainerType,
  }

  render() {
    return (
      <FilteredMenuView
        route={this.props.route}
        navigator={this.props.navigator}
        now={this.props.now}
        stationMenus={this.props.stationMenus}
        foodItems={this.props.foodItems}
        menuCorIcons={this.props.corIcons}
        menuLabel='Menu'
      />
    )
  }
}
