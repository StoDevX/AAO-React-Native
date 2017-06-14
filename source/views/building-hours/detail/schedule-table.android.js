/**
 * @flow
 *
 * <ScheduleTable/> renders the table of schedules.
 */

import React from 'react'
import {View, StyleSheet} from 'react-native'
import {Card} from '../../components/card'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isScheduleOpenAtMoment, getDayOfWeek} from '../lib'
import {ScheduleRow} from './schedule-row'

export class ScheduleTable extends React.PureComponent {
  props: {
    now: moment,
    schedules: NamedBuildingScheduleType[],
    onProblemReport: () => any,
  }

  render() {
    const {now, schedules} = this.props
    const dayOfWeek = getDayOfWeek(now)

    return (
      <View>
        {schedules.map(schedule =>
          <Card
            key={schedule.title}
            style={styles.scheduleContainer}
            header={schedule.title}
            footer={schedule.notes}
          >
            {schedule.hours.map((set, i) =>
              <ScheduleRow
                key={i}
                now={now}
                set={set}
                isActive={
                  schedule.isPhysicallyOpen !== false &&
                  set.days.includes(dayOfWeek) &&
                  isScheduleOpenAtMoment(set, this.state.now)
                }
              />,
            )}
          </Card>,
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  scheduleContainer: {
    marginBottom: 20,
  },
})
