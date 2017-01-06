// @flow
import React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import type {EventType} from './types'
import moment from 'moment-timezone'
import * as c from '../components/colors'
import {ListRow} from '../components/list-row'
import {getText, parseHtml} from '../../lib/html'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  rowIllusion: {
    paddingVertical: 4,
  },
  timesWrapper: {
    width: 70,
    paddingLeft: 4,
    flexDirection: 'row',
  },
  times: {
    flexDirection: 'column',
    justifyContent: 'space-between',
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
  border: {
    ...Platform.select({
      ios: {
        marginLeft: 8,
        width: 2,
        backgroundColor: c.iosGray,
      },
      android: {},
    }),
  },
  texts: {
    paddingLeft: 8,
    flex: 1,
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

const dotBarStyles = StyleSheet.create({
  diagram: {
    marginTop: 4,
    marginBottom: 3,
    marginLeft: 8,
    flexDirection: 'column',
    alignItems: 'center',
  },
  circle: {
    height: 5,
    width: 5,
    borderRadius: 5,
    backgroundColor: c.tint,
  },
  line: {
    width: 1,
    backgroundColor: c.tint,
    flex: 1,
  },
})

function DotBar() {
  return (
    <View style={[dotBarStyles.diagram]}>
      <View style={dotBarStyles.circle} />
      <View style={dotBarStyles.line} />
      <View style={dotBarStyles.circle} />
    </View>
  )
}

export default function EventView(props: EventType) {
  let title = getText(parseHtml(props.summary))

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
    <ListRow
      contentContainerStyle={{paddingVertical: 2}}
      style={[styles.container, props.style]}
      arrowPosition='none'
      fullWidth={true}
    >
      <View style={[styles.rowIllusion, styles.row, styles.timesWrapper]}>
        <View style={[styles.column, styles.times, {flex: 1}]}>
          {times}
        </View>
        {Platform.OS === 'android' ? <DotBar /> : null}
      </View>
      <View style={styles.border} />
      <View style={[styles.rowIllusion, styles.texts]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.location}>{props.location}</Text>
      </View>
    </ListRow>
  )
}
