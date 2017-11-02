// @flow

import React from 'react'
import {ScrollView, RefreshControl} from 'react-native'
import type {BusLineType} from './types'
import {BusLine} from './bus-line'
import moment from 'moment-timezone'
import {NoticeView} from '../../components/notice'
import type {TopLevelViewPropsType} from '../../types'
import delay from 'delay'
import {reportNetworkProblem} from '../../../lib/report-network-problem'

import * as defaultData from '../../../../docs/bus-times.json'

const TIMEZONE = 'America/Winnipeg'

const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/bus-times.json'

type Props = TopLevelViewPropsType & {
  line: string,
}

type State = {
  busLines: Array<BusLineType>,
  intervalId: number,
  loading: boolean,
  refreshing: boolean,
  now: moment,
}

export class BusView extends React.PureComponent<Props, State> {
  state = {
    busLines: defaultData.data,
    intervalId: 0,
    loading: true,
    refreshing: false,
    now: moment.tz(TIMEZONE),
    // now: moment.tz('Fri 8:13pm', 'ddd h:mma', true, TIMEZONE),
  }

  componentWillMount() {
    this.fetchData().then(() => {
      this.setState(() => ({loading: false}))
    })

    // This updates the screen every second, so that the "next bus" times
    // are updated without needing to leave and come back.
    this.setState(() => ({intervalId: setInterval(this.updateTime, 1000)}))
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  fetchData = async () => {
    let {data: busLines} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      busLines = defaultData.data
    }

    this.setState(() => ({busLines, now: moment.tz(TIMEZONE)}))
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(TIMEZONE)}))
  }

  refreshTime = async () => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    this.updateTime()

    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({refreshing: false}))
  }

  openMap = () => {
    const activeBusLine = this.findLine()
    this.props.navigation.navigate('BusMapView', {line: activeBusLine})
  }

  findLine = (): ?BusLineType => {
    const {busLines} = this.state
    const {line: thisLine} = this.props
    return busLines.find(({line}) => line === thisLine)
  }

  render() {
    let {now} = this.state
    const activeBusLine = this.findLine()

    if (!activeBusLine) {
      const lines = this.state.busLines.map(({line}) => line).join(', ')
      return (
        <NoticeView
          text={`The line "${this.props.line}" was not found among ${lines}`}
        />
      )
    }

    const refreshControl = (
      <RefreshControl
        onRefresh={this.refreshTime}
        refreshing={this.state.refreshing}
      />
    )

    return (
      <ScrollView refreshControl={refreshControl}>
        <BusLine line={activeBusLine} now={now} openMap={this.openMap} />
      </ScrollView>
    )
  }
}
