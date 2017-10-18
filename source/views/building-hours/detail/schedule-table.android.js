// @flow

import React from 'react'
import {View, StyleSheet} from 'react-native'
import {Card} from '../../components/card'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isScheduleOpenAtMoment, getDayOfWeek} from '../lib'
import {ScheduleRow} from './schedule-row'
import {ButtonCell} from '../../components/cells/button'

export class ScheduleTable extends React.PureComponent {
  props: {
    now: moment,
    schedules: NamedBuildingScheduleType[],
    onProblemReport: () => any,
  }

  render() {
    const {now, schedules, onProblemReport} = this.props
    const dayOfWeek = getDayOfWeek(now)

    return (
      <View>
        {schedules.map(schedule => (
          <Card
            key={schedule.title}
            style={styles.scheduleContainer}
            header={schedule.title}
            footer={schedule.notes}
          >
            {schedule.hours.map((set, i) => (
              <ScheduleRow
                key={i}
                now={now}
                set={set}
                isActive={
                  schedule.isPhysicallyOpen !== false &&
                  set.days.includes(dayOfWeek) &&
                  isScheduleOpenAtMoment(set, now)
                }
              />
            ))}
          </Card>
        ))}

        <Card style={styles.scheduleContainer}>
          <ButtonCell title="Suggest an Edit" onPress={onProblemReport} />
        </Card>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  scheduleContainer: {
    marginBottom: 20,
  },
})
