// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'
import type {BusLineType} from './types'
import getScheduleForNow from './get-schedule-for-now'
import getSetOfStopsForNow from './get-set-of-stops-for-now'
import zip from 'lodash/zip'
import head from 'lodash/head'
import last from 'lodash/last'
import moment from 'moment-timezone'
import * as c from '../../components/colors'

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'

let styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  rowSectionHeader: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 15,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'rgb(113, 113, 118)',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    flexDirection: 'column',
  },
  busWillSkipStopTitle: {
    color: c.iosText,
  },
  busWillSkipStopDetail: {},
  busWillSkipStopDot: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
  rowDetail: {
    flex: 1,
    marginLeft: 0,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'column',
  },
  notLastRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  passedStopDetail: {

  },
  itemTitle: {
    color: c.black,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemDetail: {
    color: c.iosText,
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: 13,
    textAlign: 'left',
  },
  barContainer: {
    paddingRight: 5,
    width: 45,
    flexDirection: 'column',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    width: 5,
  },
  dot: {
    height: 15,
    width: 15,
    marginTop: -20,
    marginBottom: -20,
    borderRadius: 20,
    zIndex: 1,
  },
  passedStop: {
    height: 12,
    width: 12,
  },
  beforeStop: {
    borderWidth: 3,
    backgroundColor: 'white',
    height: 18,
    width: 18,
  },
  atStop: {
    height: 20,
    width: 20,
    borderColor: 'white',
    borderWidth: 3,
    backgroundColor: 'white',
  },
  atStopTitle: {
    fontWeight: 'bold',
  },
  passedStopTitle: {
    color: c.iosText,
  },
})

export default function BusLineView({line, style, now}: {line: BusLineType, style: Object|number, now: typeof moment}) {
  let schedule = getScheduleForNow(line.schedules, now)

  schedule.times = schedule.times.map(timeset => {
    return timeset.map(time =>
      time === false
        ? false
        : moment
          .tz(time, TIME_FORMAT, true, TIMEZONE)
          .dayOfYear(now.dayOfYear()))
  })

  let times = getSetOfStopsForNow(schedule, now)
  let timesIndex = schedule.times.indexOf(times)

  let pairs: [[string], [typeof moment]] = zip(schedule.stops, times)

  let barColor = c.salmon
  if (line.line === 'Blue') {
    barColor = c.steelBlue
  } else if (line.line === 'Express') {
    barColor = c.moneyGreen
  }

  let currentStopColor = c.brickRed
  if (line.line === 'Blue') {
    currentStopColor = c.midnightBlue
  } else if (line.line === 'Express') {
    currentStopColor = c.hollyGreen
  }

  let isLastBus = timesIndex === schedule.times.length - 1

  let lineTitle = line.line
  if (timesIndex === 0 && now.isBefore(head(times))) {
    lineTitle += ` — Starting ${head(times).format('h:mma')}`
  } else if (now.isAfter(last(times))) {
    lineTitle += ' — Over for Today'
  } else if (isLastBus) {
    lineTitle += ' — Last Bus'
  } else {
    lineTitle += ' — Running'
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>
          {lineTitle.toUpperCase()}
        </Text>
      </View>
      <View style={[styles.listContainer]}>
        {pairs.map(([place, time], i) => {
          let afterStop = time && now.isAfter(time)
          let atStop = time && now.isSame(time, 'minute')
          let beforeStop = !afterStop && !atStop && time !== false
          let skippingStop = time === false
          let isLastRow = i === pairs.length - 1

          return <View key={i} style={styles.row}>
            <View style={styles.barContainer}>
              <View style={[styles.bar, {backgroundColor: barColor}]} />
              <View
                style={[
                  styles.dot,
                  afterStop && [styles.passedStop, {borderColor: barColor, backgroundColor: barColor}],
                  beforeStop && [styles.beforeStop, {borderColor: barColor}],
                  atStop && [styles.atStop, {borderColor: currentStopColor}],
                  skippingStop && styles.busWillSkipStopDot,
                ]}
              />
              <View style={[styles.bar, {backgroundColor: barColor}]} />
            </View>
            <View style={[
              styles.rowDetail,
              !isLastRow && styles.notLastRowContainer,
            ]}>
              <Text style={[
                styles.itemTitle,
                skippingStop && styles.busWillSkipStopTitle,
                afterStop && styles.passedStopTitle,
                atStop && styles.atStopTitle,
              ]}>
                {place}
              </Text>
              <Text
                style={[
                  styles.itemDetail,
                  skippingStop && styles.busWillSkipStopDetail,
                ]}
                numberOfLines={1}
              >
                {schedule.times
                  .slice(timesIndex)
                  .map(timeSet => timeSet[i])
                  .map(time => time === false ? 'None' : time.format(TIME_FORMAT))
                  .join(' • ')}
              </Text>
            </View>
          </View>
        })}
      </View>
    </View>
  )
}
BusLineView.propTypes = {
  line: React.PropTypes.object.isRequired,
  now: React.PropTypes.instanceOf(moment).isRequired,
  style: React.PropTypes.object,
}
