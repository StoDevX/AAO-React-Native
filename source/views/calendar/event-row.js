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
  row: {
    paddingVertical: 2,
  },
  timeContainer: {
    width: 70,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  bar: {
    marginHorizontal: 10,
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
      contentContainerStyle={styles.row}
      arrowPosition="none"
      fullWidth={true}
    >
      <Row>
        <CalendarTimes event={props} style={styles.timeContainer} />

        <Bar style={styles.bar} />

        <Column flex={1} paddingTop={2} paddingBottom={3}>
          <Title style={styles.title}>{title}</Title>
          <Detail style={styles.detail}>{props.location}</Detail>
        </Column>
      </Row>
    </ListRow>
  )
}

function CalendarTimes({event, style}: {event: EventType, style: any}) {
  const eventLength = moment
    .duration(event.endTime.diff(event.startTime))
    .asHours()
  const allDay = eventLength === 24
  const multiDay = event.startTime.dayOfYear() !== event.endTime.dayOfYear()
  const sillyZeroLength = event.startTime.isSame(event.endTime, 'minute')

  if (allDay) {
    return (
      <Column style={style}>
        <Text style={[styles.time, styles.start]}>all-day</Text>
      </Column>
    )
  }

  let start, end
  if (event.isOngoing) {
    start = event.startTime.format('MMM. D')
    end = event.endTime.format('MMM. D')
  } else if (multiDay) {
    start = event.startTime.format('h:mm A')
    end = `to ${event.endTime.format('MMM. D h:mm A')}`
  } else if (sillyZeroLength) {
    start = event.startTime.format('h:mm A')
    end = 'until ???'
  } else {
    start = event.startTime.format('h:mm A')
    end = event.endTime.format('h:mm A')
  }

  return (
    <Column style={style}>
      <Text style={[styles.time, styles.start]}>{start}</Text>
      <Text style={[styles.time, styles.end]}>{end}</Text>
    </Column>
  )
}
