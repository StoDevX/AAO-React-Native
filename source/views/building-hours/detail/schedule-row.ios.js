/**
 * @flow
 *
 * <ScheduleRow/> renders a single row of the schedule information.
 */

import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {SingleBuildingScheduleType} from '../types'
import moment from 'moment-timezone'
import {Cell} from 'react-native-tableview-simple'
import {formatBuildingTimes, summarizeDays} from '../lib'

type Props = {
  set: SingleBuildingScheduleType,
  isActive: boolean,
  now: moment,
}

export class ScheduleRow extends React.PureComponent<Props> {
  render() {
    const {set, isActive, now} = this.props
    return (
      <Cell
        cellStyle="RightDetail"
        detail={formatBuildingTimes(set, now)}
        detailTextStyle={isActive ? styles.bold : undefined}
        title={summarizeDays(set.days)}
        titleTextStyle={isActive ? styles.bold : undefined}
      />
    )
  }
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: '600',
  },
})
