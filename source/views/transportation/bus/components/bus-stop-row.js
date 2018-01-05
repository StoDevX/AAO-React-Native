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
import {
  findRemainingDeparturesForStop as findRemainingDepartures,
  findBusStopStatus as findStopStatus,
  type BusStateEnum,
} from '../lib'

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
      status: busStatus,
    } = this.props

    const stopStatus = findStopStatus({stop, busStatus, departureIndex, now})
    const times = findRemainingDepartures({stop, busStatus, departureIndex})

    const rowTextStyle = [
      stopStatus === 'skip' && styles.skippingStopTitle,
      stopStatus === 'after' && styles.passedStopTitle,
      stopStatus === 'at' && styles.atStopTitle,
    ]

    return (
      <ListRow fullHeight={true} fullWidth={true} style={styles.row}>
        <ProgressChunk
          barColor={barColor}
          currentStopColor={currentStopColor}
          isFirstChunk={isFirstRow}
          isLastChunk={isLastRow}
          stopStatus={stopStatus}
        />

        <Column flex={1} style={styles.internalPadding}>
          <Title bold={false} style={rowTextStyle}>
            {stop.name}
          </Title>
          <Detail lines={1}>
            <ScheduleTimes
              style={stopStatus === 'skip' && styles.skippingStopDetail}
              times={times}
            />
          </Detail>
        </Column>
      </ListRow>
    )
  }
}
