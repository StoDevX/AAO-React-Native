// @flow
import React from 'react'
import {ScrollView} from 'react-native'
import type {BusLineType} from './types'
import {BusLine} from './bus-line'
import moment from 'moment-timezone'
import {NoticeView} from '../../components/notice'

import {data as defaultBusLines} from '../../../../docs/bus-times.json'

export default class BusView extends React.Component {
  static defaultProps = {
    busLines: defaultBusLines,
  }

  state = {
    intervalId: 0,
    now: moment(),
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
    this.setState({now: moment()})
  }

  render() {
    let {now} = this.state
    // now = moment('Fri 8:13pm', 'ddd h:mma', true)
    const busLines = this.props.busLines
    const activeBusLine = busLines.find(({line}) => line === this.props.line)

    if (!activeBusLine) {
      return (
        <NoticeView
          text={`The line "${this.props.line}" was not found among ${busLines
            .map(({line}) => line)
            .join(', ')}`}
        />
      )
    }

    return (
      <ScrollView>
        <BusLine line={activeBusLine} now={now} />
      </ScrollView>
    )
  }
}
