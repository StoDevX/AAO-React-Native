// @flow

import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {Column} from '../../../components/layout'
import {ListRow, Detail, Title} from '../../../components/list'
import type {BusTimetableEntry} from '../types'
import type moment from 'moment'
import * as c from '../../../components/colors'
import {ProgressChunk} from './progress-chunk'
import {ScheduleTimes} from './times'
import type {BusStateEnum} from '../lib'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
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

type Props = {|
  +stop: BusTimetableEntry,
  +departureIndex: null | number,
  +now: moment,
  +barColor: string,
  +currentStopColor: string,
  +isFirstRow: boolean,
  +isLastRow: boolean,
  +status: BusStateEnum,
|}

export class BusStopRow extends React.PureComponent<Props, void> {
  render() {
    const {
      barColor,
      currentStopColor,
      departureIndex,
      isFirstRow,
      isLastRow,
      now,
      stop,
      status,
    } = this.props

    const time =
      departureIndex === null ? false : stop.departures[departureIndex]

    const afterStop =
      status === 'after-end' || (time ? now.isAfter(time, 'minute') : false)
    const atStop = time ? now.isSame(time, 'minute') : false
    const beforeStop =
      status === 'before-start' || (!afterStop && !atStop && time !== false)
    const skippingStop = time === false

    const remainingDepartures =
      status === 'before-start'
        ? stop.departures.slice(0)
        : status === 'after-end'
          ? stop.departures.slice(-1)
          : departureIndex !== null
            ? stop.departures.slice(departureIndex)
            : stop.departures.slice(0)

    const rowTextStyle = [
      skippingStop && styles.skippingStopTitle,
      afterStop && styles.passedStopTitle,
      atStop && styles.atStopTitle,
    ]

    return (
      <ListRow fullWidth={true} fullHeight={true} style={styles.row}>
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
          <Title bold={false} style={rowTextStyle}>
            {stop.name}
          </Title>
          <Detail lines={1}>
            <ScheduleTimes
              times={remainingDepartures}
              style={skippingStop ? styles.skippingStopDetail : null}
            />
          </Detail>
        </Column>
      </ListRow>
    )
  }
}
