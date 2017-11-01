// @flow
import React from 'react'
import {View, Text, StyleSheet, Platform, FlatList} from 'react-native'
import type {BusLineType, FancyBusTimeListType, BusScheduleType} from './types'
import {
  getScheduleForNow,
  getSetOfStopsForNow,
  parseTime,
  makeSubtitle,
} from './lib'
import get from 'lodash/get'
import zip from 'lodash/zip'
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

const BusLineSeparator = () => <Separator style={styles.separator} />

type Props = {
  line: BusLineType,
  now: moment,
  openMap: () => any,
}
;[]

export class BusLine extends React.Component<Props> {
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

    const stopTitleTimePairs: Array<[string, moment | false]> = zip(
      schedule.stops,
      currentMoments,
    )

    return {
      scheduledMoments,
      currentMoments,
      stopTitleTimePairs,
    }
  }

  renderItem = ({item, index}) => {
    const [placeTitle, moment] = item
    return (
      <BusStopRow
        // get the arrival time for this stop from each bus loop after
        // the current time (as given by `now`)
        times={scheduledMoments.slice(timesIndex).map(set => set[index])}
        place={placeTitle}
        now={now}
        time={moment}
        barColor={barColor}
        currentStopColor={currentStopColor}
        isFirstRow={index === 0}
        isLastRow={index === list.length - 1}
      />
    )
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

    const headerEl = (
      <ListSectionHeader
        title={line.line}
        subtitle={subtitle}
        titleStyle={androidColor}
      />
    )

    const footerMsg =
      'Bus routes and times subject to change without notice\n\nData collected by the humans of All About Olaf'
    const footerEl = <ListFooter title={footerMsg} />

    return (
      <FlatList
        ListHeaderComponent={headerEl}
        ListFooterComponent={footerEl}
        ItemSeparatorComponent={BusLineSeparator}
        data={stopTitleTimePairs}
        renderItem={this.renderItem}
      />
    )
  }
}
