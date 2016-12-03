// @flow
import React from 'react'
import {Platform, ScrollView, View, Text} from 'react-native'
import type {BusLineType} from './types'
import BusLineView from './bus-line'
import moment from 'moment-timezone'

import defaultBusLines from '../../../data/bus-times.json'

(defaultBusLines: BusLineType[])

const TIMEZONE = 'America/Winnipeg'

export default class BusView extends React.Component {
  static propTypes = {
    busLines: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    line: React.PropTypes.string.isRequired,
  }

  static defaultProps = {
    busLines: defaultBusLines,
  }

  state = {
    intervalId: 0,
    now: moment.tz(TIMEZONE),
  }

  componentWillMount() {
    // This updates the screen every second, so that the "next bus" times are
    // updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 5000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: {
    busLines: BusLineType[],
    line: string,
  }

  updateTime = () => {
    this.setState({now: moment.tz(TIMEZONE)})
  }

  render() {
    let {now} = this.state
    // now = moment.tz('Fri 8:13pm', 'ddd h:mma', true, TIMEZONE)
    const busLines = this.props.busLines
    const activeBusLine = busLines.find(({line}) => line === this.props.line)

    if (!activeBusLine) {
      return (
        <View>
          <Text>The line "{this.props.line}" was not found among {busLines.map(({line}) => line).join(', ')}</Text>
        </View>
      )
    }

    return (
      <ScrollView>
        <BusLineView
          key={activeBusLine.line}
          style={{
            marginTop: Platform.OS === 'ios' ? 15 : 0,
            marginBottom: Platform.OS === 'ios' ? 0 : 8,
          }}
          line={activeBusLine}
          now={now}
        />
      </ScrollView>
    )
  }
}
