// @flow
import React from 'react'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import type {MenuItemContainerType, MasterCorIconMapType} from '../types'
import {
  items as defaultItems,
  corIcons as defaultIcons,
} from '../../../data/pause-bonapp.js'
import {FancyMenu} from '../components/fancy-menu'

export class LocalMenu extends React.Component {
  static defaultProps = {
    foodItems: defaultItems,
    corIcons: defaultIcons,
    now: moment.tz(CENTRAL_TZ),
  }

  props: TopLevelViewPropsType & {
    now: momentT,
    corIcons: MasterCorIconMapType,
    foodItems: MenuItemContainerType,
  }

  render() {
    return (
      <FancyMenu
        route={this.props.route}
        navigator={this.props.navigator}
        now={this.props.now}
        foodItems={this.props.foodItems}
        menuCorIcons={this.props.corIcons}
        menuLabel='Menu'
      />
    )
  }
}
