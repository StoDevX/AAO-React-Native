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
import {BaseMenuView} from './base'

export class LocalMenuView extends React.Component {
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
      <BaseMenuView
        route={this.props.route}
        navigator={this.props.navigator}
        now={this.props.now}
        stationMenus={this.props.stationMenus}
        foodItems={this.props.foodItems}
        menuCorIcons={this.props.corIcons}
        menuLabel='Din-din'
      />
    )
  }
}
