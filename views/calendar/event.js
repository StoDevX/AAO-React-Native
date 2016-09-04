import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import * as c from '../components/colors'
import {getText, parseHtml} from '../../lib/html'

let styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 6,
    paddingLeft: 10,
  },
  itemTitle: {
    color: c.black,
    paddingBottom: 3,
    fontSize: 16,
    fontWeight: '500',
  },
  itemPreview: {
    color: c.iosText,
    fontSize: 13,
  },
})

// PROPS: eventTitle, location, startTime, endTime
export default function EventView(props: {eventTitle: string, location: string, startTime?: Object, endTime?: Object, style?: any}) {
  let title = getText(parseHtml(props.eventTitle))

  let showTimes = props.startTime && props.endTime
  let showLocation = Boolean(props.location)

  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.itemTitle}>{title}</Text>
      { showTimes ? <Text style={styles.itemPreview}>
        {props.startTime.format('M/D h:mma')} — {props.endTime.format('M/D h:mma')}
      </Text> : null }
      { showLocation ? <Text style={styles.itemPreview}>
        {props.location}
      </Text> : null }
    </View>
  )
}
EventView.propTypes = {
  endTime: React.PropTypes.object,
  eventTitle: React.PropTypes.string.isRequired,
  location: React.PropTypes.string,
  startTime: React.PropTypes.object,
  style: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.object]),
}
