import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import moment from 'moment-timezone'
import * as c from '../components/colors'
import {getText, parseHtml} from '../../lib/html'

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

// PROPS: eventTitle, location, startTime, endTime
export default function EventView(props: {eventTitle: string, location: string, startTime?: string, endTime?: string, style?: any}) {
  let title = getText(parseHtml(props.eventTitle))

  let stString = moment(props.startTime).format('M/D h:mma')
  let etString = moment(props.endTime).format('M/D h:mma')

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
