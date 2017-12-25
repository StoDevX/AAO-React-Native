/**
 * @flow
 *
 * Building Hours view. This component loads data from either GitHub or
 * the local copy as a fallback, and renders the list of buildings.
 */

import * as React from 'react'
import {NoticeView} from '../components/notice'
import {BuildingHoursList} from './list'

import moment from 'moment-timezone'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'
import * as defaultData from '../../../docs/building-hours.json'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import delay from 'delay'

import {CENTRAL_TZ} from './lib'
const githubBaseUrl =
  'https://stodevx.github.io/AAO-React-Native/building-hours.json'

const groupBuildings = (buildings: BuildingType[]) => {
  const grouped = groupBy(buildings, b => b.category || 'Other')
  return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const loadFavoriteBuildings = (buildings: BuildingType[]) => {
  let favoriteBuildings = Array()
  for (let i = 0; i < buildings.length; i++) {
    if (buildings[i].favorited) {
      favoriteBuildings.push(buildings[i])
    }
  }
  return favoriteBuildings
}

const loadAllBuildings = (buildings: BuildingType[]) => {
  let allBuildings = Array()
  allBuildings.push({
    title: 'Favorites',
    data: loadFavoriteBuildings(buildings),
  })
  let restOfGroups = groupBuildings(buildings)
  for (let i = 0; i < restOfGroups.length; i++) {
    allBuildings.push(restOfGroups[i])
  }
  return allBuildings
}

type Props = TopLevelViewPropsType

type State = {
  error: ?Error,
  loading: boolean,
  now: moment,
  buildings: Array<{title: string, data: BuildingType[]}>,
  intervalId: number,
}

export class BuildingHoursView extends React.Component<Props, State> {
  static navigationOptions = {
    title: 'Building Hours',
    headerBackTitle: 'Hours',
  }

  state = {
    error: null,
    loading: false,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
    buildings: loadAllBuildings(defaultData.data),
    intervalId: 0,
  }

  componentWillMount() {
    this.fetchData()
    // console.log(this.state.buildings)
    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(CENTRAL_TZ)}))
  }

  refresh = async (): any => {
    let start = Date.now()
    this.setState(() => ({loading: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({loading: false}))
  }

  fetchData = async () => {
    let {data: buildings} = await fetchJson(githubBaseUrl).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })
    if (process.env.NODE_ENV === 'development') {
      buildings = defaultData.data
    }
    this.setState(() => ({
      buildings: loadAllBuildings(buildings),
      now: moment.tz(CENTRAL_TZ),
    }))
  }

  render() {
    if (this.state.error) {
      return <NoticeView text={`Error: ${this.state.error.message}`} />
    }
    console.log('render')
    return (
      <BuildingHoursList
        buildings={this.state.buildings}
        loading={this.state.loading}
        navigation={this.props.navigation}
        now={this.state.now}
        onRefresh={this.refresh}
        onUpdate={this.fetchData}
      />
    )
  }
}
