// @flow
import React from 'react'
import {ScrollView} from 'react-native'
import defaultBusLines from '../../../data/bus-times.json'
import type {BusLineType} from './types'
import BusLineView from './bus-line'
import moment from 'moment-timezone'
const TIMEZONE = 'America/Winnipeg'

export default class BusView extends React.Component {
  static propTypes = {
    busLines: React.PropTypes.arrayOf(React.PropTypes.object),
  }

  static defaultProps = {
    busLines: defaultBusLines,
  }

  state = {
    intervalId: 0,
    now: Date.now(),
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
    busLines: BusLineType[]
  }

  updateTime = () => {
    this.setState({now: Date.now()})
  }

  render() {
    // const now = moment.tz('6:53am', 'h:mma', true, TIMEZONE)
    // now.dayOfYear(moment.tz(TIMEZONE).dayOfYear())
    const now = moment.tz(TIMEZONE)
    const busLines = this.props.busLines

    return (
      <ScrollView>
        {busLines.map((busLine: BusLineType, i) =>
          <BusLineView
            key={busLine.line}
            style={{marginBottom: i < busLines.length - 1 ? 5 : 15}}
            line={busLine}
            now={now}
          />)}
      </ScrollView>
    )
  }
}
