import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import * as c from '../components/colors'
import padEnd from 'lodash/padEnd'

let styles = StyleSheet.create({
  itemTitle: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosText,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 6,
    fontSize: 13,
    textAlign: 'left',
  },
})

function getString(date) {
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

function stripAndClean(text: string) {
  let regex = /(<([^>]+)>)/ig
  return text.replace(regex, '').trim()
}

// PROPS: eventTitle, location, startTime, endTime
export default function EventView(props: {eventTitle: string, location: string, startTime?: string, endTime?: string, style?: any}) {
  let title = stripAndClean(props.eventTitle)

  let st = new Date(props.startTime)
  let et = new Date(props.endTime)

  let stString = getString(st)
  let etString = getString(et)

  let showTimes = props.startTime && props.endTime
  let showLocation = Boolean(props.location)

  return (
    <View style={props.style}>
      <Text style={styles.itemTitle}>{title}</Text>
      { showTimes ? <Text style={styles.itemPreview}>{stString} - {etString}</Text> : null }
      { showLocation ? <Text style={styles.itemPreview}>{props.location}</Text> : null }
    </View>
  )
}
EventView.propTypes = {
  endTime: React.PropTypes.string,
  eventTitle: React.PropTypes.string.isRequired,
  location: React.PropTypes.string,
  startTime: React.PropTypes.string,
  style: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.object]),
}
