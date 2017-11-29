// @flow

import * as React from 'react'
import type {UnprocessedBusLine} from './types'
import {BusLine} from './line'
import moment from 'moment-timezone'
import {NoticeView} from '../../components/notice'
import LoadingView from '../../components/loading'
import type {TopLevelViewPropsType} from '../../types'
import delay from 'delay'
import {reportNetworkProblem} from '../../../lib/report-network-problem'

import * as defaultData from '../../../../docs/bus-times.json'

const TIMEZONE = 'America/Winnipeg'

const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/bus-times.json'

type Props = TopLevelViewPropsType & {
  +line: string,
}

type State = {|
  busLines: Array<UnprocessedBusLine>,
  activeBusLine: ?UnprocessedBusLine,
  intervalId: number,
  loading: boolean,
  refreshing: boolean,
  now: moment,
|}

export class BusView extends React.PureComponent<Props, State> {
  state = {
    busLines: defaultData.data,
    activeBusLine: null,
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
    // update without needing to leave and come back.
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

    const activeBusLine = busLines.find(({line}) => line === this.props.line)

    this.setState(() => ({busLines, activeBusLine}))
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
    this.props.navigation.navigate('BusMapView', {
      line: this.state.activeBusLine,
    })
  }

  render() {
    if (this.state.loading) {
      return <LoadingView />
    }

    const {now, activeBusLine} = this.state

    if (!activeBusLine) {
      const lines = this.state.busLines.map(({line}) => line).join(', ')
      const msg = `The line "${this.props.line}" was not found among ${lines}`
      return <NoticeView text={msg} />
    }

    return (
      <BusLine
        line={activeBusLine}
        now={now}
        onRefresh={this.refreshTime}
        openMap={this.openMap}
        refreshing={this.state.refreshing}
      />
    )
  }
}
