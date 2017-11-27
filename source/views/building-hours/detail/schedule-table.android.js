// @flow

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {Card} from '../../components/card'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isScheduleOpenAtMoment, getDayOfWeek} from '../lib'
import {ScheduleRow} from './schedule-row'
import {ButtonCell} from '../../components/cells/button'

type Props = {
  now: moment,
  schedules: NamedBuildingScheduleType[],
  onProblemReport: () => any,
}

export class ScheduleTable extends React.PureComponent<Props> {
  render() {
    const {now, schedules, onProblemReport} = this.props
    const dayOfWeek = getDayOfWeek(now)

    return (
      <View>
        {schedules.map(schedule => (
          <Card
            key={schedule.title}
            footer={schedule.notes}
            header={schedule.title}
            style={styles.scheduleContainer}
          >
            {schedule.hours.map((set, i) => (
              <ScheduleRow
                key={i}
                isActive={
                  schedule.isPhysicallyOpen !== false &&
                  set.days.includes(dayOfWeek) &&
                  isScheduleOpenAtMoment(set, now)
                }
                now={now}
                set={set}
              />
            ))}
          </Card>
        ))}

        <Card style={styles.scheduleContainer}>
          <ButtonCell onPress={onProblemReport} title="Suggest an Edit" />
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
