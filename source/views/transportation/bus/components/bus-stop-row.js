// @flow

import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {Column} from '../../../components/layout'
import {ListRow, Detail, Title} from '../../../components/list'
import type {BusTimetableEntry} from '../types'
import type moment from 'moment'
import * as c from '../../../components/colors'
import {ProgressChunk, type BusStopStatusEnum} from './progress-chunk'
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

export class BusStopRow extends React.PureComponent<any, Props, void> {
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

    let stopStatus: BusStopStatusEnum = 'skip'
    let arrivalTime: false | ?moment = false
    let remainingDepartures = stop.departures.slice(0)

    switch (status) {
      case 'before-start': {
        stopStatus = 'before'
        arrivalTime = stop.departures[0]
        break
      }
      case 'after-end': {
        stopStatus = 'after'
        arrivalTime = stop.departures[stop.departures.length - 1]
        remainingDepartures = stop.departures.slice(-1)
        break
      }
      default: {
        arrivalTime =
          departureIndex === null ? false : stop.departures[departureIndex]

        if (arrivalTime && now.isAfter(arrivalTime, 'minute')) {
          stopStatus = 'after'
        } else if (arrivalTime && now.isSame(arrivalTime, 'minute')) {
          stopStatus = 'at'
        } else if (arrivalTime !== false) {
          stopStatus = 'before'
        } else {
          stopStatus = 'skip'
        }

        remainingDepartures =
          departureIndex !== null
            ? stop.departures.slice(departureIndex)
            : stop.departures.slice(0)
      }
    }

    if (arrivalTime === false) {
      stopStatus = 'skip'
    }

    const rowTextStyle = [
      stopStatus === 'skip' && styles.skippingStopTitle,
      stopStatus === 'after' && styles.passedStopTitle,
      stopStatus === 'at' && styles.atStopTitle,
    ]

    return (
      <ListRow fullWidth={true} fullHeight={true} style={styles.row}>
        <ProgressChunk
          barColor={barColor}
          stopStatus={stopStatus}
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
              style={stopStatus === 'skip' && styles.skippingStopDetail}
            />
          </Detail>
        </Column>
      </ListRow>
    )
  }
}
