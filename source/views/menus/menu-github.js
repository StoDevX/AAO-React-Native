// @flow
import React from 'react'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
import {FancyMenu} from './components/fancy-menu'
import type {TopLevelViewPropsType} from '../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import sample from 'lodash/sample'
import type {MenuItemType, MasterCorIconMapType, StationMenuType} from './types'
import {upgradeMenuItem, upgradeStation} from './lib/process-menu-shorthands'
const {data: fallbackMenu} = require('../../docs/pause-menu.json')
import {tracker} from '../../analytics'

const githubMenuBaseUrl = 'https://stodevx.github.io/AAO-React-Native'

export class GitHubHostedMenu extends React.Component {
  state: {
    error: ?Error,
    loading: boolean,
    now: momentT,
    foodItems: MenuItemType[],
    corIcons: MasterCorIconMapType,
    stationMenus: StationMenuType[],
  } = {
    error: null,
    loading: true,
    now: moment.tz(CENTRAL_TZ),
    foodItems: [],
    corIcons: {},
    stationMenus: [],
  }

  componentWillMount() {
    this.fetchData()
  }

  props: TopLevelViewPropsType & {
    name: string,
    cafeId: string,
    loadingMessage: string[],
  }

  fetchData = async () => {
    this.setState({loading: true})

    let foodItems: MenuItemType[] = []
    let stationMenus: StationMenuType[] = []
    let corIcons: MasterCorIconMapType = {}
    try {
      let container = await fetchJson(`${githubMenuBaseUrl}/pause-menu.json`)
      let data = container.data
      foodItems = data.foodItems || []
      stationMenus = data.stationMenus || []
      corIcons = data.corIcons || {}
    } catch (err) {
      tracker.trackException(err.message)
      console.warn(err)
      foodItems = fallbackMenu.foodItems || []
      stationMenus = fallbackMenu.stationMenus || []
      corIcons = fallbackMenu.corIcons || {}
    }

    if (__DEV__) {
      foodItems = fallbackMenu.foodItems
      stationMenus = fallbackMenu.stationMenus || []
      corIcons = fallbackMenu.corIcons || {}
    }

    foodItems = foodItems.map(upgradeMenuItem)
    stationMenus = stationMenus.map(upgradeStation)
    this.setState({loading: false, corIcons, foodItems, stationMenus, now: moment.tz(CENTRAL_TZ)})
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text={sample(this.props.loadingMessage)} />
    }

    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <FancyMenu
        route={this.props.route}
        navigator={this.props.navigator}
        foodItems={this.state.foodItems}
        stationMenus={this.state.stationMenus}
        menuCorIcons={this.state.corIcons}
        menuLabel='Menu'
        now={this.state.now}
        name={this.props.name}
      />
    )
  }
}
