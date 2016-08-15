import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import * as c from '../components/colors'
import padEnd from 'lodash/padEnd'

let styles = StyleSheet.create({
  event: {
    backgroundColor: c.coolPurple,
    paddingBottom: 10,
    marginBottom: 5,
    justifyContent: 'flex-end',
  },
  title: {
    color: c.white,
    fontSize: 20,
    marginLeft: 5,
  },
  time: {
    color: c.white,
    marginLeft: 5,
  },
  location: {
    color: c.white,
    marginLeft: 5,
  },
})

// PROPS: eventTitle, location, startTime, endTime
export default class EventView extends React.Component {
  static propTypes = {
    endTime: React.PropTypes.string.isRequired,
    eventTitle: React.PropTypes.string.isRequired,
    location: React.PropTypes.string.isRequired,
    startTime: React.PropTypes.string.isRequired,
  }

  state = {
    start: null,
    end: null,
  }

  componentWillMount() {
    this.parseDates(this.props.startTime, this.props.endTime)
  }

  getString(date) {
    let month = date.getMonth() + 1 // offset since JS uses 0-11, not 1-12
    let day = date.getDate()

    let hours = date.getHours()
    let isMorning = true
    if (date.getHours() > 12) {
      hours = date.getHours() - 12
      isMorning = false
    }

    let min = date.getMinutes()
    if (min.toString().length < 2) {
      min = padEnd(min, 2, '0')
    }

    if (isMorning) {
      min += 'AM'
    } else {
      min += 'PM'
    }

    return `${month}/${day} ${hours}:${min}`
  }

  parseDates(startTime, endTime) {
    let st = new Date(startTime)
    let et = new Date(endTime)

    let stString = this.getString(st)
    let etString = this.getString(et)

    this.setState({start: stString})
    this.setState({end: etString})
  }

  render() {
    return (
      <View style={styles.event}>
        <Text style={styles.title}>{this.props.eventTitle}</Text>
        <Text style={styles.time}>{this.state.start} - {this.state.end}</Text>
        <Text style={styles.location}>{this.props.location}</Text>
      </View>
    )
  }
}
