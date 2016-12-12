// @flow
import React from 'react'
import {View, Text} from 'react-native'
import LoadingView from '../../components/loading'
import type {TopLevelViewPropsType} from '../../types'
import {TopLevelViewPropTypes} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import sample from 'lodash/sample'
import type {StationMenuType, MenuItemContainerType} from '../types'
import {stations as defaultStations, items as defaultItems} from '../../../data/pause-bonapp.js'
import {BaseMenuView} from './base'

export default class PauseMenuView extends React.Component {
  static propTypes = {
    loadingMessage: React.PropTypes.string.isRequired,
    ...TopLevelViewPropTypes,
  }

  static defaultProps = {
    menuStations: defaultStations,
    menuItems: defaultItems,
  }

  state: {
    loading: boolean,
    now: momentT,
  } = {
    loading: false,
    cafeId: 'LionsPause',
    now: moment.tz(CENTRAL_TZ),
  }

  props: TopLevelViewPropsType & {
    cafeId: string,
    loadingMessage: string[],
    menuStations: StationMenuType[],
    menuItems: MenuItemContainerType,
  }

  render() {
    if (this.state.loading) {
      let msg = sample(this.props.loadingMessage)
      return <LoadingView text={msg} />
    }

    if (!this.state.cafeMenu || !this.state.cafeInfo) {
      return (
        <View>
          <Text>Something went wrong. Email odt@stolaf.edu to let them know?</Text>
        </View>
      )
    }

    return (
      <BaseMenuView
        route={this.props.route}
        navigator={this.props.navigator}
        now={this.state.now}
        menuStations={this.props.menuStations}
        menuItems={this.props.menuItems}
        menuLabel='Din-din'
      />
    )
  }
}
