// @flow
import React from 'react'
import {Platform, StyleSheet, Text} from 'react-native'
import {Column} from '../../components/layout'
import {ListRow, Detail, Title} from '../../components/list'
import type {BusTimetableEntry, DepartureTimeList} from './types'
import type moment from 'moment'
import * as c from '../../components/colors'
import {ProgressChunk} from './components/progress-chunk'

const TIME_FORMAT = 'h:mma'

const styles = StyleSheet.create({
  skippingStopTitle: {
    color: c.iosDisabledText,
  },
  skippingStopDetail: {},
  internalPadding: {
    paddingVertical: Platform.OS === 'ios' ? 8 : 15,
  },
  atStopTitle: {
    fontWeight: Platform.OS === 'ios' ? '500' : '600',
  },
  passedStopTitle: {
    color: c.iosDisabledText,
  },
})

type Props = {
  stop: BusTimetableEntry,
  departureIndex: false | number,
  now: moment,
  barColor: string,
  currentStopColor: string,
  isFirstRow: boolean,
  isLastRow: boolean,
}

export class BusStopRow extends React.PureComponent<Props> {
  render() {
    const {
      barColor,
      currentStopColor,
      departureIndex,
      isFirstRow,
      isLastRow,
      now,
      stop,
    } = this.props

    const time =
      departureIndex === false ? false : stop.departures[departureIndex]

    const afterStop = time ? now.isAfter(time, 'minute') : false
    const atStop = time ? now.isSame(time, 'minute') : false
    const beforeStop = !afterStop && !atStop && time !== false
    const skippingStop = time === false

    return (
      <ListRow fullWidth={true} fullHeight={true}>
        <ProgressChunk
          barColor={barColor}
          afterStop={afterStop}
          beforeStop={beforeStop}
          atStop={atStop}
          skippingStop={skippingStop}
          currentStopColor={currentStopColor}
          isFirstChunk={isFirstRow}
          isLastChunk={isLastRow}
        />

        <Column flex={1} style={styles.internalPadding}>
          <Title
            bold={false}
            style={[
              skippingStop && styles.skippingStopTitle,
              afterStop && styles.passedStopTitle,
              atStop && styles.atStopTitle,
            ]}
          >
            {stop.name}
          </Title>
          <Detail lines={1}>
            <ScheduleTimes
              times={stop.departures.slice(departureIndex || 0)}
              skippingStop={skippingStop}
            />
          </Detail>
        </Column>
      </ListRow>
    )
  }
}

type ScheduleTimesProps = {
  skippingStop: boolean,
  times: DepartureTimeList,
}

class ScheduleTimes extends React.PureComponent<ScheduleTimesProps> {
  render() {
    const {times, skippingStop} = this.props

    return (
      <Text style={skippingStop && styles.skippingStopDetail}>
        {times
          // and format the times
          .map(time => (!time ? 'None' : time.format(TIME_FORMAT)))
          .join(' • ')}
      </Text>
    )
  }
}
