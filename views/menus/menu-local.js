// @flow
import React from 'react'
import type {TopLevelViewPropsType} from '../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import type {MenuItemContainerType, MasterCorIconMapType} from './types'
import {items as defaultItems, corIcons as defaultIcons} from '../../data/pause-bonapp.js'
import {FancyMenu} from './components/fancy-menu'

export class LocalMenu extends React.Component {
  static defaultProps = {
    corIcons: defaultIcons,
    foodItems: defaultItems,
    now: moment.tz(CENTRAL_TZ),
  }

  props: TopLevelViewPropsType & {
    corIcons: MasterCorIconMapType,
    foodItems: MenuItemContainerType,
    now: momentT,
  }

  render() {
    return (
      <FancyMenu
        route={this.props.route}
        navigator={this.props.navigator}
        foodItems={this.props.foodItems}
        menuCorIcons={this.props.corIcons}
        menuLabel='Menu'
        now={this.props.now}
      />
    )
  }
}
