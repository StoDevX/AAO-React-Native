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

export class BusView extends React.PureComponent {
  props: TopLevelViewPropsType & {
    line: string,
  }

  state = {
    busLines: defaultData.data,
    intervalId: 0,
    loading: false,
    now: moment.tz(TIMEZONE),
    // now: moment.tz('Fri 8:13pm', 'ddd h:mma', true, TIMEZONE),
  }

  componentWillMount() {
    this.fetchData()
    // This updates the screen every five seconds, so that the "next bus"
    // times are updated without needing to leave and come back.
    this.setState(() => ({intervalId: setInterval(this.updateTime, 5000)}))
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  fetchData = async () => {
    const start = Date.now()
    this.setState(() => ({loading: true}))

    let {data: busLines} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      busLines = defaultData.data
    }

    this.updateTime()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({busLines, loading: false}))
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(TIMEZONE)}))
  }

  refreshTime = async () => {
    const start = Date.now()
    this.setState(() => ({loading: true}))
    this.updateTime()
    const elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({loading: false}))
  }

  openMap = () => {
    const activeBusLine = this.findLine()
    this.props.navigation.navigate('BusMapView', {line: activeBusLine})
  }

  findLine = (): ?BusLineType => {
    let {busLines} = this.state
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

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            onRefresh={this.refreshTime}
            refreshing={this.state.loading}
          />
        }
      >
        <BusLine line={activeBusLine} now={now} openMap={this.openMap} />
      </ScrollView>
    )
  }
}
