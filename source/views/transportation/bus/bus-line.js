// @flow
import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import type {BusLineType, FancyBusTimeListType} from './types'
import {getScheduleForNow, getSetOfStopsForNow} from './lib'
import get from 'lodash/get'
import zip from 'lodash/zip'
import head from 'lodash/head'
import last from 'lodash/last'
import Icon from 'react-native-vector-icons/Ionicons'
import moment from 'moment-timezone'
import * as c from '../../components/colors'
import {Separator} from '../../components/separator'
import {BusStopRow} from './bus-stop-row'
import {ListRow, ListSectionHeader, Title, Detail} from '../../components/list'
import {Row, Column} from '../../components/layout'

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
    lineDetail = `Starts ${now
      .clone()
      .seconds(0)
      .to(head(moments))}`
  } else if (now.isAfter(last(moments))) {
    lineDetail = 'Over for Today'
  } else if (isLastBus) {
    lineDetail = 'Last Bus'
  }

  return lineDetail
}

const parseTime = (now: moment) => time => {
  // either pass `false` through or return a parsed time
  if (time === false) {
    return false
  }

  return (
    moment
      // interpret in Central time
      .tz(time, TIME_FORMAT, true, TIMEZONE)
      // and set the date to today
      .dayOfYear(now.dayOfYear())
  )
}

export class BusLine extends React.PureComponent {
  props: {line: BusLineType, now: moment, openMap: () => any}

  render() {
    const {line, now} = this.props

    // grab the colors (with fallbacks) via _.get
    const barColor = get(barColors, line.line, c.black)
    const currentStopColor = get(stopColors, line.line, c.gray)
    const androidColor = Platform.OS === 'android' ? {color: barColor} : null

    const schedule = getScheduleForNow(line.schedules, now)
    if (!schedule) {
      return (
        <View>
          <ListSectionHeader title={line.line} titleStyle={androidColor} />
          <ListRow>
            <Title>
              <Text>This line is not running today.</Text>
            </Title>
          </ListRow>
        </View>
      )
    }

    const scheduledMoments: FancyBusTimeListType[] = schedule.times.map(
      timeset => timeset.map(parseTime(now)),
    )

    const moments: FancyBusTimeListType = getSetOfStopsForNow(
      scheduledMoments,
      now,
    )
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

        {pairs.map(([placeTitle, moment], i, list) => (
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
            <Separator style={styles.separator} />
          </View>
        ))}

        <ListRow
          onPress={this.props.openMap}
          fullWidth={true}
          spacing={{left: 45}}
        >
          <Row alignItems="center">
            <Column alignItems="center" width={45} paddingRight={5}>
              <Icon
                name={
                  Platform.OS === 'ios' ? 'ios-navigate-outline' : 'md-navigate'
                }
                size={24}
                style={{color: c.iosDisabledText}}
              />
            </Column>

            <Column>
              <Title>
                <Text>Open Map</Text>
              </Title>

              <Detail>
                <Text>See the planned bus route on a map!</Text>
              </Detail>
            </Column>
          </Row>
        </ListRow>
      </View>
    )
  }
}
