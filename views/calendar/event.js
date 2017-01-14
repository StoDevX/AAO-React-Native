// @flow
import React from 'react'
import {StyleSheet, Text} from 'react-native'
import type {EventType} from './types'
import moment from 'moment-timezone'
import * as c from '../components/colors'
import {Row, Column} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import {fastGetTrimmedText} from '../../lib/html'
import {Bar} from './vertical-bar'

const styles = StyleSheet.create({
  timeContainer: {
    width: 70,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  time: {
    textAlign: 'right',
  },
  start: {
    color: c.black,
  },
  end: {
    color: c.iosDisabledText,
  },
})

export default function EventView(props: EventType) {
  const title = fastGetTrimmedText(props.summary)

  return (
    <ListRow
      contentContainerStyle={{paddingVertical: 2}}
      arrowPosition='none'
      fullWidth={true}
    >
      <Row>
        <CalendarTimes {...props} style={styles.timeContainer} />

        <Bar style={{marginHorizontal: 10}} />

        <Column flex={1} paddingTop={2} paddingBottom={3}>
          <Title style={styles.title}>{title}</Title>
          <Detail style={styles.detail}>{props.location}</Detail>
        </Column>
      </Row>
    </ListRow>
  )
}

function CalendarTimes(props: EventType) {
  const eventLength = moment.duration(props.endTime.diff(props.startTime)).asHours()
  const allDay = eventLength === 24
  const multiDay = eventLength > 24

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
      <Text key={0} style={[styles.time, styles.start]}>{props.startTime.format('h:mm A')}</Text>,
      <Text key={1} style={[styles.time, styles.end]}>to {props.endTime.format('MMM. D h:mm A')}</Text>,
    ]
  } else if (props.startTime.isSame(props.endTime, 'minute')) {
    times = [
      <Text key={0} style={[styles.time, styles.start]}>{props.startTime.format('h:mm A')}</Text>,
      <Text key={1} style={[styles.time, styles.end]}>until ???</Text>,
    ]
  } else {
    times = [
      <Text key={0} style={[styles.time, styles.start]}>{props.startTime.format('h:mm A')}</Text>,
      <Text key={1} style={[styles.time, styles.end]}>{props.endTime.format('h:mm A')}</Text>,
    ]
  }

  return (
    <Column style={props.style}>
      {times}
    </Column>
  )
}
