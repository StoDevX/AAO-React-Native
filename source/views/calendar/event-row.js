// @flow
import React from 'react'
import {StyleSheet, Text} from 'react-native'
import {type EventType, formatTimes} from '../../lib/calendar'
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

type EventRowPropsType = {
  event: EventType,
  now: moment,
}
export default function EventRow({event, now}: EventRowPropsType) {
  const title = fastGetTrimmedText(event.summary)

  return (
    <ListRow
      contentContainerStyle={styles.row}
      arrowPosition="none"
      fullWidth={true}
    >
      <Row>
        <CalendarTimes event={event} style={styles.timeContainer} now={now} />

        <Bar style={styles.bar} />

        <Column flex={1} paddingTop={2} paddingBottom={3}>
          <Title style={styles.title}>{title}</Title>
          <Detail style={styles.detail}>{event.location}</Detail>
        </Column>
      </Row>
    </ListRow>
  )
}

type CalendarTimesPropsType = {
  event: EventType,
  style: number | Object | Array<number | Object>,
  now: moment,
}
function CalendarTimes({event, style, now}: CalendarTimesPropsType) {
  const {start, end, allDay} = formatTimes(event, now)

  if (allDay) {
    return (
      <Column style={style}>
        <Text style={[styles.time, styles.start]}>all-day</Text>
      </Column>
    )
  }

  return (
    <Column style={style}>
      <Text style={[styles.time, styles.start]}>{start}</Text>
      <Text style={[styles.time, styles.end]}>{end}</Text>
    </Column>
  )
}
