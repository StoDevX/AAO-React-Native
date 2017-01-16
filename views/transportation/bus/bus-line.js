// @flow
import React from 'react'
import {View, StyleSheet, Platform} from 'react-native'
import type {BusLineType, FancyBusTimeListType} from './types'
import {getScheduleForNow, getSetOfStopsForNow} from './lib'
import get from 'lodash/get'
import zip from 'lodash/zip'
import head from 'lodash/head'
import last from 'lodash/last'
import moment from 'moment-timezone'
import * as c from '../../components/colors'
import {Separator} from '../../components/separator'
import {BusStopRow} from './bus-stop-row'
import {ListRow} from '../../components/list'
import {ListSectionHeader} from '../../components/list'

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
  separator: {
    marginLeft: 45,
    // erase the gap in the bar caused by the separators' block-ness
    marginTop: -1,
  },
})

const barColors = {
  'Blue Line': c.steelBlue,
  'Express Bus': c.moneyGreen,
  'Red Line': c.salmon,
}
const stopColors = {
  'Blue Line': c.midnightBlue,
  'Express Bus': c.hollyGreen,
  'Red Line': c.brickRed,
}

function makeSubtitle({now, moments, isLastBus}) {
  let lineDetail = 'Running'

  if (now.isBefore(head(moments))) {
    lineDetail = `Starts ${now.to(head(moments))}`
  } else if (now.isAfter(last(moments))) {
    lineDetail = 'Over for Today'
  } else if (isLastBus) {
    lineDetail = 'Last Bus'
  }

  return lineDetail
}

export function BusLine({line, now}: {line: BusLineType, now: moment}) {
  // grab the colors (with fallbacks) via _.get
  const barColor = get(barColors, line.line, c.black)
  const currentStopColor = get(stopColors, line.line, c.gray)
  const androidColor = Platform.OS === 'android' ? {color: barColor} : null

  const schedule = getScheduleForNow(line.schedules, now)
  if (!schedule) {
    return (
      <View>
        <ListSectionHeader title={line.line} titleStyle={androidColor} />
        <ListRow title='This line is not running today.' />
      </View>
    )
  }

  const scheduledMoments: FancyBusTimeListType[] = schedule.times.map(timeset => {
    return timeset.map(time =>
      // either pass `false` through or return a parsed time
      time === false ? false : moment
        // interpret in Central time
        .tz(time, TIME_FORMAT, true, TIMEZONE)
        // and set the date to today
        .dayOfYear(now.dayOfYear()))
  })

  const moments: FancyBusTimeListType = getSetOfStopsForNow(scheduledMoments, now)
  const pairs: [[string, moment]] = zip(schedule.stops, moments)

  const timesIndex = scheduledMoments.indexOf(moments)
  const isLastBus = timesIndex === scheduledMoments.length - 1
  const subtitle = makeSubtitle({now, moments, isLastBus})

  return (
    <View>
      <ListSectionHeader
        title={line.line}
        subtitle={subtitle}
        titleStyle={androidColor}
      />

      {pairs.map(([placeTitle, moment], i, list) =>
        <View key={i}>
          <BusStopRow
            // get the arrival time for this stop from each bus loop after
            // the current time (as given by `now`)
            times={scheduledMoments.slice(timesIndex).map(set => set[i])}
            place={placeTitle}

            now={now}
            time={moment}

            barColor={barColor}
            currentStopColor={currentStopColor}

            isFirstRow={i === 0}
            isLastRow={i === list.length - 1}
          />
          {i < list.length - 1 ? <Separator style={styles.separator} /> : null}
        </View>)}
    </View>
  )
}
