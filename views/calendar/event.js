// @flow
import React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import type {EventType} from './types'
import moment from 'moment-timezone'
import * as c from '../components/colors'
import {getTrimmedTextWithSpaces, parseHtml} from '../../lib/html'

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    flexDirection: 'row',
  },
  rowIllusion: {
    paddingVertical: 4,
  },
  times: {
    width: 70,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingLeft: 4,
  },
  timeText: {
    textAlign: 'right',
    fontSize: 10,
  },
  startTime: {
    color: c.black,
  },
  endTime: {
    color: c.iosDisabledText,
  },
  texts: {
    paddingLeft: 10,
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: c.iosGray,
  },
  title: {
    color: c.black,
    fontWeight: '500',
    paddingBottom: 3,
    fontSize: 14,
  },
  location: {
    color: c.iosDisabledText,
    fontSize: 10,
  },
})

export default function EventView(props: EventType) {
  let title = getTrimmedTextWithSpaces(parseHtml(props.summary))

  let eventLength = moment.duration(props.endTime.diff(props.startTime)).asHours()
  let allDay = eventLength === 24
  let multiDay = eventLength > 24

  let times = null
  if (allDay) {
    times = <Text style={[styles.timeText, styles.startTime]}>all-day</Text>
  } else if (props.isOngoing) {
    times = [
      <Text key={0} style={[styles.timeText, styles.startTime]}>{props.startTime.format('MMM. D')}</Text>,
      <Text key={1} style={[styles.timeText, styles.endTime]}>{props.endTime.format('MMM. D')}</Text>,
    ]
  } else if (multiDay) {
    times = [
      <Text key={0} style={[styles.timeText, styles.startTime]}>{props.startTime.format('h:mma')}</Text>,
      <Text key={1} style={[styles.timeText, styles.endTime]}>to {props.endTime.format('MMM. D h:mma')}</Text>,
    ]
  } else if (props.startTime.isSame(props.endTime, 'minute')) {
    times = [
      <Text key={0} style={[styles.timeText, styles.startTime]}>{props.startTime.format('h:mma')}</Text>,
      <Text key={1} style={[styles.timeText, styles.endTime]}>until ???</Text>,
    ]
  } else {
    times = [
      <Text key={0} style={[styles.timeText, styles.startTime]}>{props.startTime.format('h:mma')}</Text>,
      <Text key={1} style={[styles.timeText, styles.endTime]}>{props.endTime.format('h:mma')}</Text>,
    ]
  }

  return (
    <View style={[styles.container, props.style]}>
      <View style={[styles.rowIllusion, styles.times]}>
        {times}
      </View>
      <View style={[styles.rowIllusion, styles.texts]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.location}>{props.location}</Text>
      </View>
    </View>
  )
}
