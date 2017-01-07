// @flow
import React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import type {EventType} from './types'
import moment from 'moment-timezone'
import * as c from '../components/colors'
import {ListRow} from '../components/list'
import {getText, parseHtml} from '../../lib/html'
import {Bar} from './vertical-bar'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  time: {
    textAlign: 'right',
    fontSize: 10,
  },
  start: {
    color: c.black,
  },
  endTime: {
    color: c.iosDisabledText,
  },
})

export default function EventView(props: EventType) {
  const title = getText(parseHtml(props.summary))

  return (
    <ListRow
      contentContainerStyle={{paddingVertical: 2}}
      arrowPosition='none'
      spacing={{left: 0}}

      leftColumn={
        <View style={{flexDirection: 'row', width: 70}}>
          <CalendarTimes {...props} />
          <Bar />
        </View>
      }

      title={title}
      description={props.location}
    />
  )
}

function CalendarTimes(props: EventType) {
  let eventLength = moment.duration(props.endTime.diff(props.startTime)).asHours()
  let allDay = eventLength === 24
  let multiDay = eventLength > 24

  let times = null
  if (allDay) {
    times = <Text style={[styles.time, styles.start]}>all-day</Text>
  } else if (props.isOngoing) {
    times = [
      <Text key={0} style={[styles.time, styles.start]}>{props.startTime.format('MMM. D')}</Text>,
      <Text key={1} style={[styles.time, styles.end]}>{props.endTime.format('MMM. D')}</Text>,
    ]
  } else if (multiDay) {
    times = [
      <Text key={0} style={[styles.time, styles.start]}>{props.startTime.format('h:mma')}</Text>,
      <Text key={1} style={[styles.time, styles.end]}>to {props.endTime.format('MMM. D h:mma')}</Text>,
    ]
  } else if (props.startTime.isSame(props.endTime, 'minute')) {
    times = [
      <Text key={0} style={[styles.time, styles.start]}>{props.startTime.format('h:mma')}</Text>,
      <Text key={1} style={[styles.time, styles.end]}>until ???</Text>,
    ]
  } else {
    times = [
      <Text key={0} style={[styles.time, styles.start]}>{props.startTime.format('h:mma')}</Text>,
      <Text key={1} style={[styles.time, styles.end]}>{props.endTime.format('h:mma')}</Text>,
    ]
  }

  return (
    <View style={[styles.container]}>
      {times}
    </View>
  )
}
