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

export default function EventRow({
  event,
  onPress,
}: {
  event: EventType,
  onPress: () => any,
}) {
  const title = fastGetTrimmedText(event.summary)

  const location = event.location && event.location.trim().length
    ? <Detail style={styles.detail}>{event.location}</Detail>
    : null

  return (
    <ListRow
      contentContainerStyle={styles.row}
      arrowPosition="top"
      fullWidth={true}
      onPress={onPress}
    >
      <Row>
        <CalendarTimes event={event} style={styles.timeContainer} />

        <Bar style={styles.bar} />

        <Column
          flex={1}
          paddingTop={2}
          paddingBottom={3}
          justifyContent="space-between"
        >
          <Title style={styles.title}>{title}</Title>
          {location}
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

  let startTimeFormatted = event.startTime.format('h:mm A')
  let endTimeFormatted = event.endTime.format('h:mm A')
  let midnightTime = '12:00 AM'

  let start, end
  if (event.isOngoing) {
    start = event.startTime.format('MMM. D')
    end = event.endTime.format('MMM. D')
  } else if (multiDay) {
    // 12:00 PM to Jun. 25 3:00pm
    // Midnight to Jun. 25 <-- assuming the end time is also midnight
    start = startTimeFormatted
    const endFormat = endTimeFormatted === midnightTime
      ? 'MMM. D'
      : 'MMM. D h:mm A'
    end = `to ${event.endTime.format(endFormat)}`
  } else if (sillyZeroLength) {
    start = startTimeFormatted
    end = 'until ???'
  } else {
    start = startTimeFormatted
    end = endTimeFormatted
  }

  start = start === midnightTime ? 'Midnight' : start
  end = end === midnightTime ? 'Midnight' : end

  return (
    <Column style={style}>
      <Text style={[styles.time, styles.start]}>{start}</Text>
      <Text style={[styles.time, styles.end]}>{end}</Text>
    </Column>
  )
}
