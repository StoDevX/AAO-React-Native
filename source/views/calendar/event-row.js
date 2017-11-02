// @flow
import React from 'react'
import {StyleSheet, Text} from 'react-native'
import type {EventType} from './types'
import * as c from '../components/colors'
import {Row, Column} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import {fastGetTrimmedText} from '../../lib/html'
import {Bar} from './vertical-bar'
import {times} from './times'

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

type Props = {
  event: EventType,
  onPress: EventType => any,
}

export default class EventRow extends React.PureComponent<Props> {
  _onPress = () => this.props.onPress(this.props.event)

  render() {
    const {event} = this.props
    const title = fastGetTrimmedText(event.summary)

    const location =
      event.location && event.location.trim().length ? (
        <Detail>{event.location}</Detail>
      ) : null

    return (
      <ListRow
        contentContainerStyle={styles.row}
        arrowPosition="top"
        fullWidth={true}
        onPress={this._onPress}
      >
        <Row minHeight={46}>
          <CalendarTimes event={event} style={styles.timeContainer} />

          <Bar style={styles.bar} />

          <Column
            flex={1}
            paddingTop={2}
            paddingBottom={3}
            justifyContent="space-between"
          >
            <Title>{title}</Title>
            {location}
          </Column>
        </Row>
      </ListRow>
    )
  }
}

function CalendarTimes({event, style}: {event: EventType, style: any}) {
  const {allDay, start, end} = times(event)

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
