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

export class ScheduleRow extends React.PureComponent {
  props: {
    set: SingleBuildingScheduleType,
    isActive: boolean,
    now: moment,
  }

  render() {
    const {set, isActive, now} = this.props
    return (
      <Cell
        cellStyle="RightDetail"
        title={summarizeDays(set.days)}
        titleTextStyle={isActive ? styles.bold : undefined}
        detail={formatBuildingTimes(set, now)}
        detailTextStyle={isActive ? styles.bold : undefined}
      />
    )
  }
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: '600',
  },
})
