import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native'

import * as c from '../components/colors'

var styles = StyleSheet.create({
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
  constructor(props) {
    super(props)
    this.state = {
      start: null,
      end:null,
    }
  }

  componentWillMount() {
    this.parseDates(this.props.startTime, this.props.endTime)
  }

  getString(date) {
    var month = date.getMonth() + 1 // offset since JS uses 0-11, not 1-12
    var day = date.getDate()

    if (date.getHours() > 12) {
      var hours = date.getHours() - 12
      hours = hours
      var isMorning = false;
    } else {
      var hours = date.getHours()
      var isMorning = true;
    }
    var min = date.getMinutes()
    if (min.toString().length < 2) {
      min = "" + min + "0"
    }

    if (isMorning) {
      min += "AM"
    } else {
      min += "PM"
    }

    var str = "" + month + "/" + day +  " " + hours + ":" + min
    return str
  }

  parseDates(startTime, endTime) {
    var st = new Date(startTime)
    var et = new Date(endTime)

    var stString = this.getString(st)
    var etString = this.getString(et)

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
