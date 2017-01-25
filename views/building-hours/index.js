// @flow
/**
 * All About Olaf
 * Building Hours view. This component loads data from either GitHub or
 * the local copy as a fallback, and renders the list of buildings.
 */

import React from 'react'
import {NoticeView} from '../components/notice'
import {tracker} from '../../analytics'
import {BuildingHoursList} from './list'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'
import {data as fallbackBuildingHours} from '../../docs/building-hours'
import groupBy from 'lodash/groupBy'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

export {BuildingHoursDetailView} from './detail'

const githubBaseUrl = 'https://stodevx.github.io/AAO-React-Native'

const groupBuildings = (buildings: BuildingType[]) => groupBy(buildings, b => b.category || 'Other')


export class BuildingHoursView extends React.Component {
  state: {
    error: ?Error,
    loading: boolean,
    now: momentT,
    buildings: {[key: string]: BuildingType[]},
    intervalId: number,
  } = {
    error: null,
    loading: true,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
    buildings: groupBuildings(fallbackBuildingHours),
    intervalId: 0,
  }

  componentWillMount() {
    this.fetchData()

    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: TopLevelViewPropsType;

  updateTime = () => {
    this.setState({now: moment.tz(CENTRAL_TZ)})
  }

  fetchData = async () => {
    this.setState({loading: true})

    let buildings: BuildingType[] = []
    try {
      let container = await fetchJson(`${githubBaseUrl}/building-hours.json`)
      let data = container.data
      buildings = data
    } catch (err) {
      tracker.trackException(err.message)
      console.warn(err)
      buildings = fallbackBuildingHours
    }

    if (__DEV__) {
      buildings = fallbackBuildingHours
    }

    this.setState({
      loading: false,
      buildings: groupBuildings(buildings),
      now: moment.tz(CENTRAL_TZ),
    })
  }

  render() {
    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <BuildingHoursList
        route={this.props.route}
        navigator={this.props.navigator}
        buildings={this.state.buildings}
        now={this.state.now}
        onRefresh={this.fetchData}
        loading={this.state.loading}
      />
    )
  }
}
