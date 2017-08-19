// @flow

import React from 'react'
import {ScrollView} from 'react-native'
import type {BusLineType} from './types'
import {BusLine} from './bus-line'
import moment from 'moment-timezone'
import {NoticeView} from '../../components/notice'
import type {TopLevelViewPropsType} from '../../types'

import {data as defaultBusLines} from '../../../../docs/bus-times.json'

const TIMEZONE = 'America/Winnipeg'

export class BusView extends React.PureComponent {
  static defaultProps = {
    busLines: defaultBusLines,
  }

  props: TopLevelViewPropsType & {
    busLines: BusLineType[],
    line: string,
  }

  state = {
    intervalId: 0,
    now: moment.tz(TIMEZONE),
  }

  componentWillMount() {
    // This updates the screen every second, so that the "next bus" times are
    // updated without needing to leave and come back.
    this.setState(() => ({intervalId: setInterval(this.updateTime, 5000)}))
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(TIMEZONE)}))
  }

  openMap = () => {
    this.props.navigation.navigate('BusMapView', {line: this.props.line})
  }

  render() {
    let {now} = this.state
    // now = moment.tz('Fri 8:13pm', 'ddd h:mma', true, TIMEZONE)
    const busLines = this.props.busLines
    const activeBusLine = busLines.find(({line}) => line === this.props.line)

    if (!activeBusLine) {
      const {line} = this.props
      const lines = busLines.map(({line}) => line).join(', ')
      return (
        <NoticeView text={`The line "${line}" was not found among ${lines}`} />
      )
    }

    return (
      <ScrollView>
        <BusLine line={activeBusLine} now={now} openMap={this.openMap} />
      </ScrollView>
    )
  }
}
