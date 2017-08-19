// @flow
import React from 'react'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
import {FancyMenu} from './components/fancy-menu'
import type {TopLevelViewPropsType} from '../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import fromPairs from 'lodash/fromPairs'
import filter from 'lodash/filter'
import type {
  MenuItemType,
  MasterCorIconMapType,
  StationMenuType,
  MenuItemContainerType,
  ProcessedMealType,
} from './types'
import {upgradeMenuItem, upgradeStation} from './lib/process-menu-shorthands'
import {data as fallbackMenu} from '../../../docs/pause-menu.json'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
const CENTRAL_TZ = 'America/Winnipeg'

const githubMenuBaseUrl = 'https://stodevx.github.io/AAO-React-Native'

export class GitHubHostedMenu extends React.Component {
  props: TopLevelViewPropsType & {
    name: string,
    loadingMessage: string[],
  }

  state: {
    error: ?Error,
    loading: boolean,
    now: momentT,
    foodItems: MenuItemContainerType,
    corIcons: MasterCorIconMapType,
    meals: ProcessedMealType[],
  } = {
    error: null,
    loading: true,
    now: moment.tz(CENTRAL_TZ),
    foodItems: {},
    corIcons: {},
    meals: [],
  }

  componentWillMount() {
    this.fetchData()
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
      bugsnag.notify(err)
      console.warn(err)
      foodItems = fallbackMenu.foodItems || []
      stationMenus = fallbackMenu.stationMenus || []
      corIcons = fallbackMenu.corIcons || {}
    }

    if (process.env.NODE_ENV === 'development') {
      foodItems = fallbackMenu.foodItems
      stationMenus = fallbackMenu.stationMenus || []
      corIcons = fallbackMenu.corIcons || {}
    }

    foodItems = fromPairs(
      foodItems.map(upgradeMenuItem).map(item => [item.id, item]),
    )
    stationMenus = stationMenus.map((menu, index) => ({
      ...upgradeStation(menu, index),
      items: filter(foodItems, item => item.station === menu.label).map(
        item => item.id,
      ),
    }))

    this.setState({
      loading: false,
      corIcons,
      foodItems,
      meals: [
        {
          label: 'Menu',
          stations: stationMenus,
          starttime: '0:00',
          endtime: '23:59',
        },
      ],
      now: moment.tz(CENTRAL_TZ),
    })
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
        navigation={this.props.navigation}
        foodItems={this.state.foodItems}
        menuCorIcons={this.state.corIcons}
        meals={this.state.meals}
        now={this.state.now}
        name={this.props.name}
      />
    )
  }
}
