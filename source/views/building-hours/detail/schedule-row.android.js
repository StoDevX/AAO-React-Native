/**
 * @flow
 *
 * <ScheduleRow/> renders a single row of the schedule information.
 */

import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import type {SingleBuildingScheduleType} from '../types'

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
      <View style={styles.scheduleRow}>
        <StyledText style={[styles.scheduleDays, isActive && styles.bold]}>
          {summarizeDays(set.days)}
        </StyledText>

        <StyledText style={[styles.scheduleHours, isActive && styles.bold]}>
          {formatBuildingTimes(set, now)}
        </StyledText>
      </View>
    )
  }
}

const StyledText = ({children, style}) => (
  <Text selectable={true} numberOfLines={1} style={style}>
    {children}
  </Text>
)

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  scheduleDays: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 16,
  },
  scheduleHours: {
    flex: 2,
  },
})
