// @flow
import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import type {BusLineType, FancyBusTimeListType, BusScheduleType} from './types'
import {getScheduleForNow, getSetOfStopsForNow} from './lib'
import get from 'lodash/get'
import zip from 'lodash/zip'
import head from 'lodash/head'
import last from 'lodash/last'
import moment from 'moment-timezone'
import * as c from '../../components/colors'
import {Separator} from '../../components/separator'
import {BusStopRow} from './bus-stop-row'
import {
  ListRow,
  ListSectionHeader,
  Title,
  ListFooter,
} from '../../components/list'

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
    const startsIn = now
      .clone()
      .seconds(0)
      .to(head(moments))
    lineDetail = `Starts ${startsIn}`
  } else if (now.isAfter(last(moments))) {
    lineDetail = 'Over for Today'
  } else if (isLastBus) {
    lineDetail = 'Last Bus'
  }

  return lineDetail
}

const parseTime = (now: moment) => (time: string | false) => {
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

type Props = {
  line: BusLineType,
  now: moment,
  openMap: () => any,
}

export class BusLine extends React.PureComponent<Props> {
  shouldComponentUpdate(nextProps: Props) {
    // We won't check the time in shouldComponentUpdate, because we really
    // only care if the bus information has changed, and this is called after
    // setStateFromProps runs.

    return (
      this.props.now.isSame(nextProps.now, 'minute') ||
      this.props.line !== nextProps.line ||
      this.props.openMap !== nextProps.openMap
    )
  }

  generateScheduleInfo = (schedule: BusScheduleType, now: moment) => {
    const parseTimes = timeset => timeset.map(parseTime(now))
    const scheduledMoments: Array<FancyBusTimeListType> = schedule.times.map(
      parseTimes,
    )

    const currentMoments: FancyBusTimeListType = getSetOfStopsForNow(
      scheduledMoments,
      now,
    )

    const stopTitleTimePairs: Array<[string, moment]> = zip(
      schedule.stops,
      currentMoments,
    )

    return {
      scheduledMoments,
      currentMoments,
      stopTitleTimePairs,
    }
  }

  render() {
    const {line, now} = this.props

    const schedule = getScheduleForNow(line.schedules, now)

    // grab the colors (with fallbacks) via _.get
    const barColor = get(barColors, line.line, c.black)
    const currentStopColor = get(stopColors, line.line, c.gray)
    const androidColor = Platform.OS === 'android' ? {color: barColor} : null

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

    const {
      scheduledMoments,
      currentMoments,
      stopTitleTimePairs,
    } = this.generateScheduleInfo(schedule, now)

    const timesIndex = scheduledMoments.indexOf(currentMoments)
    const isLastBus = timesIndex === scheduledMoments.length - 1
    const subtitle = makeSubtitle({now, moments: currentMoments, isLastBus})

    return (
      <View>
        <ListSectionHeader
          title={line.line}
          subtitle={subtitle}
          titleStyle={androidColor}
        />

        {stopTitleTimePairs.map(([placeTitle, moment], i, list) => (
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
            {i < list.length - 1 ? (
              <Separator style={styles.separator} />
            ) : null}
          </View>
        ))}

        {/*<ListRow
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
        </ListRow>*/}

        <ListFooter
          title={
            'Bus routes and times subject to change without notice\n\nData collected by the humans of All About Olaf'
          }
        />
      </View>
    )
  }
}
