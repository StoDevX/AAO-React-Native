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
  }

  render() {
    const {now, schedules} = this.props
    const dayOfWeek = getDayOfWeek(now)

    return (
      <View>
        {schedules.map(set =>
          <Card
            key={set.title}
            style={styles.scheduleContainer}
            header={set.title}
            footer={set.notes}
          >
            {set.hours.map((schedule, i) =>
              <ScheduleRow
                key={i}
                now={now}
                schedule={schedule}
                isActive={
                  set.isPhysicallyOpen !== false &&
                  schedule.days.includes(dayOfWeek) &&
                  isScheduleOpenAtMoment(schedule, this.state.now)
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
